import type { DatakitConfig, FieldName, NodeType } from './strict'
import { IMPLICIT_NODE_NAMES } from '../constants'
import { collectConnectionRefs, isOutRef } from './shared'
import { getNodeIo, type GraphValidationMode, type NodeIO } from './node-io'

export type GraphValidationIssue = {
  code:
    | 'DUPLICATE_NODE_NAME'
    | 'UNKNOWN_NODE'
    | 'INVALID_REF'
    | 'UNKNOWN_FIELD'
    | 'MULTI_UPSTREAM'
    | 'WHOLE_FIELD_MIX'
    | 'SELF_LOOP'
    | 'CYCLE'
    | 'BRANCH_INVALID_REF'
    | 'BRANCH_UNKNOWN_NODE'
    | 'BRANCH_IMPLICIT_NODE'
    | 'CONNECTION_BOTH_SIDES'
    | 'INVALID_IMPLICIT_EDGE'
  message: string
  path: Array<string | number>
}

export type GraphValidationOptions = {
  mode: GraphValidationMode
}

const IMPLICIT_NAME_SET = new Set<string>(IMPLICIT_NODE_NAMES)

function isImplicitName(name: string): boolean {
  return IMPLICIT_NAME_SET.has(name)
}

function parseRef(value: string): { nodeName: string, fieldName?: string } | null {
  if (!value) return null
  const parts = value.split('.')
  if (parts.length > 2) return null
  const [nodeName, fieldName] = parts
  if (!nodeName) return null
  if (fieldName === '') return null
  return fieldName ? { nodeName, fieldName } : { nodeName }
}

function canUseWhole(
  io: NodeIO | undefined,
  direction: 'input' | 'output',
): boolean {
  if (!io) return true
  const side = direction === 'input' ? io.inputs : io.outputs
  return side !== undefined
}

function isFieldAllowed(
  io: NodeIO | undefined,
  direction: 'input' | 'output',
  fieldName?: string,
  dynamicFields?: string[],
): boolean {
  if (!fieldName) return canUseWhole(io, direction)
  const side = direction === 'input' ? io?.inputs : io?.outputs
  if (side === null) return false
  if (!side) return false
  if (side.includes('*')) {
    if (dynamicFields && dynamicFields.length > 0) {
      return dynamicFields.includes(fieldName)
    }
    return true
  }
  return side.includes(fieldName as FieldName)
}

function buildAdjacency(edges: Array<{ source: string, target: string }>) {
  const adj = new Map<string, Set<string>>()
  for (const edge of edges) {
    if (!adj.has(edge.source)) {
      adj.set(edge.source, new Set())
    }
    adj.get(edge.source)!.add(edge.target)
  }
  return adj
}

function hasCycle(edges: Array<{ source: string, target: string }>): boolean {
  const adj = buildAdjacency(edges)
  const visiting = new Set<string>()
  const visited = new Set<string>()

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) {
      return true
    }
    if (visited.has(node)) {
      return false
    }
    visiting.add(node)
    for (const next of adj.get(node) ?? []) {
      if (dfs(next)) {
        return true
      }
    }
    visiting.delete(node)
    visited.add(node)
    return false
  }

  for (const node of adj.keys()) {
    if (dfs(node)) {
      return true
    }
  }
  return false
}

export function validateGraph(
  config: DatakitConfig | null | undefined,
  options: GraphValidationOptions,
): GraphValidationIssue[] {
  const issues: GraphValidationIssue[] = []
  if (!config || !Array.isArray(config.nodes)) {
    return issues
  }

  const nodeNameList = config.nodes.map((node) => node.name)
  const nodeTypeByName = new Map<string, NodeType>()
  const nameCount = new Map<string, number>()

  nodeNameList.forEach((name, index) => {
    const count = nameCount.get(name) ?? 0
    nameCount.set(name, count + 1)
    if (count > 0) {
      issues.push({
        code: 'DUPLICATE_NODE_NAME',
        message: `Duplicate node name: "${name}"`,
        path: ['nodes', index, 'name'],
      })
    }
  })

  config.nodes.forEach((node) => {
    nodeTypeByName.set(node.name, node.type)
  })

  const allowedNames = new Set<string>([...IMPLICIT_NODE_NAMES, ...nodeNameList])

  const pairOutPath = new Map<string, Array<string | number>>()
  const pairInPath = new Map<string, Array<string | number>>()

  const edges: Array<{ source: string, target: string, targetField?: string }> = []
  const targetWholeKey = new Map<string, Array<string | number>>()
  const targetFieldKey = new Map<string, Array<string | number>>()
  const dynamicOutputs = new Map<string, string[]>()

  for (const node of config.nodes) {
    if (node.type === 'static' && node.values && typeof node.values === 'object') {
      dynamicOutputs.set(node.name, Object.keys(node.values))
    }
  }
  if (config.resources?.vault && typeof config.resources.vault === 'object') {
    dynamicOutputs.set('vault', Object.keys(config.resources.vault))
  }

  const addEdge = (
    source: string,
    target: string,
    targetField: string | undefined,
    path: Array<string | number>,
  ) => {
    edges.push({ source, target, targetField })

    if (targetField) {
      const wholeKey = `${target}.__whole__`
      if (targetWholeKey.has(wholeKey)) {
        issues.push({
          code: 'WHOLE_FIELD_MIX',
          message: 'cannot mix whole-node and field-level inputs on same target',
          path,
        })
      }

      const fieldKey = `${target}.${targetField}`
      if (targetFieldKey.has(fieldKey)) {
        issues.push({
          code: 'MULTI_UPSTREAM',
          message: `Multiple upstream connections for input "${target}.${targetField}"`,
          path,
        })
      } else {
        targetFieldKey.set(fieldKey, path)
      }
      return
    }

    const fieldOnTarget = Array.from(targetFieldKey.keys()).some((key) => key.startsWith(`${target}.`))
    if (fieldOnTarget) {
      issues.push({
        code: 'WHOLE_FIELD_MIX',
        message: 'cannot mix whole-node and field-level inputs on same target',
        path,
      })
    }

    const wholeKey = `${target}.__whole__`
    if (targetWholeKey.has(wholeKey)) {
      issues.push({
        code: 'MULTI_UPSTREAM',
        message: `Multiple upstream connections for input "${target}"`,
        path,
      })
    } else {
      targetWholeKey.set(wholeKey, path)
    }
  }

  config.nodes.forEach((node, index) => {
    const nodeIo = getNodeIo(node.type, options.mode)
    const nodeDynamicOutputs = dynamicOutputs.get(node.name) ?? []

    for (const ref of collectConnectionRefs(node, index)) {
      const parsed = parseRef(ref.value)
      if (!parsed) {
        issues.push({
          code: 'INVALID_REF',
          message: `Invalid connection "${ref.value}", expected "NODE" or "NODE.FIELD"`,
          path: ref.path,
        })
        continue
      }

      const otherName = parsed.nodeName
      const otherField = parsed.fieldName

      if (!allowedNames.has(otherName)) {
        issues.push({
          code: 'UNKNOWN_NODE',
          message: `Unknown node "${otherName}" in connection "${ref.value}"`,
          path: ref.path,
        })
        continue
      }

      const pathSlot = ref.path[2]

      if (isOutRef(ref)) {
        const key = `${ref.nodeName}->${otherName}`
        if (pairInPath.has(key)) {
          issues.push({
            code: 'CONNECTION_BOTH_SIDES',
            message: `Connection specified on both sides: "${ref.nodeName}" outputs to "${otherName}" and "${otherName}" inputs from "${ref.nodeName}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairOutPath.set(key, pairOutPath.get(key) ?? ref.path)
        }
      } else {
        const key = `${otherName}->${ref.nodeName}`
        if (pairOutPath.has(key)) {
          issues.push({
            code: 'CONNECTION_BOTH_SIDES',
            message: `Connection specified on both sides: "${otherName}" outputs to "${ref.nodeName}" and "${ref.nodeName}" inputs from "${otherName}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairInPath.set(key, pairInPath.get(key) ?? ref.path)
        }
      }

      const isOutputs = pathSlot === 'output' || pathSlot === 'outputs'
      const targetField = pathSlot === 'inputs' || pathSlot === 'outputs'
        ? String(ref.path[3])
        : undefined

      if (isOutputs) {
        const sourceField = pathSlot === 'outputs' ? String(ref.path[3]) : undefined

        if (!isFieldAllowed(nodeIo, 'output', sourceField, nodeDynamicOutputs)) {
          issues.push({
            code: 'UNKNOWN_FIELD',
            message: sourceField
              ? `Unknown output field "${sourceField}" on node "${node.name}"`
              : `Node "${node.name}" does not allow whole outputs`,
            path: ref.path,
          })
        }

        const otherType = nodeTypeByName.get(otherName) ?? (isImplicitName(otherName) ? otherName as NodeType : undefined)
        const otherIo = otherType ? getNodeIo(otherType, options.mode) : undefined
        if (!isFieldAllowed(otherIo, 'input', otherField)) {
          issues.push({
            code: 'UNKNOWN_FIELD',
            message: otherField
              ? `Unknown input field "${otherField}" on node "${otherName}"`
              : `Node "${otherName}" does not allow whole inputs`,
            path: ref.path,
          })
        }

        if (otherName === 'request') {
          issues.push({
            code: 'INVALID_IMPLICIT_EDGE',
            message: 'cannot target "request"',
            path: ref.path,
          })
        }

        if (ref.nodeName === otherName) {
          issues.push({
            code: 'SELF_LOOP',
            message: 'self-loop not allowed',
            path: ref.path,
          })
        }

        addEdge(ref.nodeName, otherName, otherField, ref.path)
      } else {
        if (!isFieldAllowed(nodeIo, 'input', targetField)) {
          issues.push({
            code: 'UNKNOWN_FIELD',
            message: targetField
              ? `Unknown input field "${targetField}" on node "${node.name}"`
              : `Node "${node.name}" does not allow whole inputs`,
            path: ref.path,
          })
        }

        const otherType = nodeTypeByName.get(otherName) ?? (isImplicitName(otherName) ? otherName as NodeType : undefined)
        const otherIo = otherType ? getNodeIo(otherType, options.mode) : undefined
        const otherDynamicOutputs = dynamicOutputs.get(otherName) ?? []
        if (!isFieldAllowed(otherIo, 'output', otherField, otherDynamicOutputs)) {
          issues.push({
            code: 'UNKNOWN_FIELD',
            message: otherField
              ? `Unknown output field "${otherField}" on node "${otherName}"`
              : `Node "${otherName}" does not allow whole outputs`,
            path: ref.path,
          })
        }

        if (otherName === 'response') {
          issues.push({
            code: 'INVALID_IMPLICIT_EDGE',
            message: 'cannot source from "response"',
            path: ref.path,
          })
        }

        if (ref.nodeName === otherName) {
          issues.push({
            code: 'SELF_LOOP',
            message: 'self-loop not allowed',
            path: ref.path,
          })
        }

        addEdge(otherName, ref.nodeName, targetField, ref.path)
      }
    }

    const branches = ['then', 'else'] as const
    for (const branch of branches) {
      const list = (node as Record<string, unknown>)[branch]
      if (!Array.isArray(list)) {
        continue
      }
      list.forEach((entry, entryIndex) => {
        if (typeof entry !== 'string') {
          return
        }
        if (entry.includes('.')) {
          issues.push({
            code: 'BRANCH_INVALID_REF',
            message: `Invalid branch reference "${entry}", expected node name`,
            path: ['nodes', index, branch, entryIndex],
          })
          return
        }
        if (isImplicitName(entry)) {
          issues.push({
            code: 'BRANCH_IMPLICIT_NODE',
            message: `Branch nodes must not be implicit: "${entry}"`,
            path: ['nodes', index, branch, entryIndex],
          })
          return
        }
        if (!allowedNames.has(entry)) {
          issues.push({
            code: 'BRANCH_UNKNOWN_NODE',
            message: `Unknown node "${entry}" in branch "${branch}"`,
            path: ['nodes', index, branch, entryIndex],
          })
        }
      })
    }
  })

  const cycleEdges = edges.filter((edge) => edge.source && edge.target)
  if (hasCycle(cycleEdges)) {
    issues.push({
      code: 'CYCLE',
      message: 'graph contains cycle',
      path: ['nodes'],
    })
  }

  return issues
}
