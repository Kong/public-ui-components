import type {
  ConfigEdge,
  ConfigNode,
  EdgeInstance,
  EditorState,
  FieldName,
  ImplicitNodeName,
  MakeNodeInstancePayload,
  NodeInstance,
  NodeName,
  NodeType,
  UINode,
} from '../../types'
import { isImplicitName } from '../node/node'
import {
  createId,
  clone,
  findFieldByName,
  getFieldsFromMeta,
  IMPLICIT_NODE_NAMES,
  makeDefaultImplicitUINode,
  parseNameConnection,
  toFieldArray,
} from './helpers'

export function initEditorState(
  configNodes: ConfigNode[],
  uiNodes: UINode[],
): EditorState {
  const uiNodesMap = new Map<NodeName, UINode>(
    uiNodes.map((uiNode) => [uiNode.name, uiNode]),
  )
  const nodes: NodeInstance[] = []
  const edges: EdgeInstance[] = []
  const nodesMap = new Map<NodeName, NodeInstance>()
  const connections: ConfigEdge[] = []
  const adjacencies = new Map<NodeName, Set<NodeName>>() // Undirected adjacency list

  /**
   * [SIDE EFFECT]
   *
   * Walk the graph with the undirected adjacency list to find all nodes that are
   * ultimately connected to the start nodes.
   *
   * Time complexity (upper): O(n) (n = nodes + edges)
   *
   * @param starts - The starting nodes to begin the search from
   */
  const markRequestNodes = (starts: NodeName[]) => {
    const visited = new Set<NodeName>()
    const queue = [...starts]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      if (!isImplicitName(current)) {
        nodesMap.get(current)!.phase = 'request'
      }

      if (!adjacencies.has(current)) continue
      for (const next of adjacencies.get(current)!) {
        if (visited.has(next)) continue
        queue.push(next)
      }
    }
  }

  // config nodes
  for (const configNode of configNodes) {
    const uiNode = uiNodesMap.get(configNode.name)
    const node = buildNodeInstance(configNode.type, configNode, uiNode)
    nodes.push(node)
    nodesMap.set(node.name, node)
  }

  // ensure implicit nodes
  for (const implicitName of IMPLICIT_NODE_NAMES) {
    if (!nodesMap.has(implicitName)) {
      const uiNode =
        uiNodesMap.get(implicitName) ?? makeDefaultImplicitUINode(implicitName)
      const node = buildNodeInstance(implicitName, undefined, uiNode)
      nodes.push(node)
      nodesMap.set(node.name, node)
    }
  }

  // collect connections
  for (const configNode of configNodes) {
    collectConnectionsFromConfigNode(configNode, connections)
  }

  // materialize edges
  for (const connection of connections) {
    const sourceNode = nodesMap.get(connection.source)
    const targetNode = nodesMap.get(connection.target)
    if (!sourceNode || !targetNode) {
      if (!sourceNode)
        console.warn(
          `[initEditorState] skip: source "${connection.source}" not found`,
        )
      if (!targetNode)
        console.warn(
          `[initEditorState] skip: target "${connection.target}" not found`,
        )
      continue
    }

    if (!adjacencies.has(connection.source)) {
      adjacencies.set(connection.source, new Set())
    }
    adjacencies.get(connection.source)!.add(connection.target)

    if (!adjacencies.has(connection.target)) {
      adjacencies.set(connection.target, new Set())
    }
    adjacencies.get(connection.target)!.add(connection.source)

    edges.push({
      id: createId('edge'),
      source: sourceNode.id,
      sourceField: findFieldByName(sourceNode, 'output', connection.sourceField)
        ?.id,
      target: targetNode.id,
      targetField: findFieldByName(targetNode, 'input', connection.targetField)
        ?.id,
    })
  }

  // Mark all nodes that should be in 'request' phase
  markRequestNodes(['request', 'service_request'])

  return { nodes, edges }
}

export function makeNodeInstance(payload: MakeNodeInstancePayload): NodeInstance {
  const { type, name, phase, position, fields, config } = payload
  const defaults = getFieldsFromMeta(type)

  return {
    id: createId('node'),
    type,
    name: name ?? (type as ImplicitNodeName),
    phase:
      phase ??
      (type === 'request' || type === 'service_request'
        ? 'request'
        : 'response'),
    position: position ?? { x: 0, y: 0 },
    expanded: {},
    fields: {
      input: toFieldArray(fields?.input ?? defaults.input),
      output: toFieldArray(fields?.output ?? defaults.output),
    },
    config: config ? clone(config) : {},
  }
}

export function buildNodeInstance(
  type: NodeType,
  configNode?: ConfigNode,
  uiNode?: UINode,
): NodeInstance {
  return makeNodeInstance({
    type,
    name: configNode?.name,
    phase:
      uiNode?.phase ??
      (type === 'request' || type === 'service_request'
        ? 'request'
        : 'response'),
    position: uiNode?.position,
    fields: mergeFieldsFromConfigAndUI(configNode, uiNode),
    config: configNode ? extractConfig(configNode) : undefined,
  })
}

/** Strip identity and IO fields. */
export function extractConfig(configNode: ConfigNode): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, name, input, inputs, output, outputs, ...rest } = configNode
  return clone(rest)
}

export function collectConnectionsFromConfigNode(
  configNode: ConfigNode,
  out: ConfigEdge[],
): void {
  const self = configNode.name

  if (configNode.input) {
    const { nodeName, fieldName } = parseNameConnection(configNode.input)
    if (nodeName)
      out.push({ source: nodeName, sourceField: fieldName, target: self })
  }

  if (configNode.inputs) {
    for (const [toFieldName, connection] of Object.entries(configNode.inputs)) {
      const { nodeName, fieldName } = parseNameConnection(connection)
      if (nodeName) {
        out.push({
          source: nodeName,
          sourceField: fieldName,
          target: self,
          targetField: toFieldName as FieldName,
        })
      }
    }
  }

  if (configNode.output) {
    const { nodeName, fieldName } = parseNameConnection(configNode.output)
    if (nodeName)
      out.push({ source: self, target: nodeName, targetField: fieldName })
  }

  if (configNode.outputs) {
    for (const [fromFieldName, connection] of Object.entries(
      configNode.outputs,
    )) {
      const { nodeName, fieldName } = parseNameConnection(connection)
      if (nodeName) {
        out.push({
          source: self,
          sourceField: fromFieldName as FieldName,
          target: nodeName,
          targetField: fieldName,
        })
      }
    }
  }
}

function mergeFieldsFromConfigAndUI(
  configNode?: ConfigNode,
  uiNode?: UINode,
): MakeNodeInstancePayload['fields'] | undefined {
  if (!configNode && !uiNode) return undefined

  const inputsFields = new Set<string>()
  const outputsFields = new Set<string>()

  // Add fields from configNode
  if (configNode?.inputs) {
    Object.keys(configNode.inputs).forEach(fieldName => inputsFields.add(fieldName))
  }

  if (configNode?.outputs) {
    Object.keys(configNode.outputs).forEach(fieldName => outputsFields.add(fieldName))
  }

  // Add fields from uiNode
  if (uiNode?.fields?.input) {
    uiNode.fields.input.forEach(fieldName => inputsFields.add(fieldName))
  }

  if (uiNode?.fields?.output) {
    uiNode.fields.output.forEach(fieldName => outputsFields.add(fieldName))
  }

  const result: MakeNodeInstancePayload['fields'] = {}

  if (inputsFields.size) result.input = Array.from(inputsFields) as FieldName[]
  if (outputsFields.size) result.output = Array.from(outputsFields) as FieldName[]

  return Object.keys(result).length ? result : undefined
}
