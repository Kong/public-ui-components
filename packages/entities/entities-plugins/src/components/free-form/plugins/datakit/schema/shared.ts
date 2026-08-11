import type { z } from 'zod'
import type { ConfigNode, DatakitConfig } from './strict'

export type ConnectionRef = {
  nodeName: string
  path: Array<string | number>
  value: string
}

export function collectConnectionRefs(
  node: ConfigNode,
  nodeIndex: number,
): ConnectionRef[] {
  const out: ConnectionRef[] = []
  const push = (path: Array<string | number>, v: unknown) => {
    if (typeof v === 'string') {
      out.push({
        nodeName: node.name,
        path: ['nodes', nodeIndex, ...path],
        value: v,
      })
    }
  }
  if ('input' in node && node.input != null) push(['input'], node.input)
  if ('inputs' in node && node.inputs && typeof node.inputs === 'object') {
    for (const [k, v] of Object.entries(node.inputs)) {
      if (v != null) push(['inputs', k], v)
    }
  }
  if ('output' in node && node.output != null) push(['output'], node.output)
  if ('outputs' in node && node.outputs && typeof node.outputs === 'object') {
    for (const [k, v] of Object.entries(node.outputs)) {
      if (v != null) push(['outputs', k], v)
    }
  }
  return out
}

export function isOutRef(ref: ConnectionRef) {
  const slot = ref.path[2]
  return slot === 'output' || slot === 'outputs'
}

export function hasAnyNonNullEntry(obj?: Record<string, unknown> | null): boolean {
  if (!obj) return false
  for (const v of Object.values(obj)) {
    if (v != null) return true
  }
  return false
}

type IONode = {
  input?: unknown
  inputs?: Record<string, unknown> | null
  output?: unknown
  outputs?: Record<string, unknown> | null
}

export function validateInputOutputExclusivity(
  node: IONode,
  ctx: z.RefinementCtx,
) {
  const hasInput = node.input !== undefined && node.input !== null
  const hasInputs = hasAnyNonNullEntry(node.inputs)
  if (hasInput && hasInputs) {
    ctx.addIssue({
      code: 'custom',
      message: 'A node cannot use both "input" and "inputs". Use one or the other.',
      path: ['inputs'],
    })
  }

  const hasOutput = node.output !== undefined && node.output !== null
  const hasOutputs = hasAnyNonNullEntry(node.outputs)
  if (hasOutput && hasOutputs) {
    ctx.addIssue({
      code: 'custom',
      message: 'A node cannot use both "output" and "outputs". Use one or the other.',
      path: ['outputs'],
    })
  }
}

export function validateNamesAndConnections(
  config: DatakitConfig,
  implicitNames: readonly string[],
  ctx: z.RefinementCtx,
) {
  if (!config.nodes) return

  const names = config.nodes.map((n) => n.name)
  const seen = new Set<string>()
  names.forEach((name, i) => {
    if (seen.has(name)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate node name: "${name}"`,
        path: ['nodes', i, 'name'],
      })
    }
    seen.add(name)
  })

  const allowed = new Set<string>([...implicitNames, ...names])
  const pairOutPath = new Map<string, Array<string | number>>()
  const pairInPath = new Map<string, Array<string | number>>()

  config.nodes.forEach((node, i) => {
    for (const ref of collectConnectionRefs(node, i)) {
      const other = ref.value.split('.', 1)[0]!
      if (!allowed.has(other)) {
        ctx.addIssue({
          code: 'custom',
          message: `Unknown node "${other}" in connection "${ref.value}"`,
          path: ref.path,
        })
      }
      if (isOutRef(ref)) {
        const key = `${ref.nodeName}->${other}`
        if (pairInPath.has(key)) {
          ctx.addIssue({
            code: 'custom',
            message: `Connection specified on both sides: "${ref.nodeName}" outputs to "${other}" and "${other}" inputs from "${ref.nodeName}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairOutPath.set(key, pairOutPath.get(key) ?? ref.path)
        }
      } else {
        const key = `${other}->${ref.nodeName}`
        if (pairOutPath.has(key)) {
          ctx.addIssue({
            code: 'custom',
            message: `Connection specified on both sides: "${other}" outputs to "${ref.nodeName}" and "${ref.nodeName}" inputs from "${other}". Specify it on one side only.`,
            path: ref.path,
          })
        } else {
          pairInPath.set(key, pairInPath.get(key) ?? ref.path)
        }
      }
    }
  })
}
