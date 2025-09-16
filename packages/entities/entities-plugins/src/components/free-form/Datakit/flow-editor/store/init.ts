import { IMPLICIT_NODE_NAMES } from '../../constants'
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
  NodePhase,
  NodeType,
  UINode,
} from '../../types'
import { isImplicitName, isImplicitType } from '../node/node'
import {
  clone,
  createId,
  findFieldByName,
  getFieldsFromMeta,
  getNodeMeta,
  makeDefaultImplicitUINode,
  parseNameConnection,
  toFieldArray,
} from './helpers'

/**
 * Create an initial editor state
 *
 * @param configNodes The config nodes for the functionality
 * @param uiNodes The UI nodes for the layout
 * @param keepHistory Whether to keep the history after the initial layout
 * @returns The initial editor state
 */
export function initEditorState(
  configNodes: ConfigNode[],
  uiNodes: UINode[],
  keepHistory?: boolean,
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

  let needLayout = false

  // config nodes
  for (const configNode of configNodes) {
    const uiNode = uiNodesMap.get(configNode.name)
    if (!uiNode && !needLayout) {
      needLayout = true
    }
    const node = buildNodeInstance(configNode.type, configNode, uiNode)
    nodes.push(node)
    nodesMap.set(node.name, node)
  }

  // ensure implicit nodes
  for (const implicitName of IMPLICIT_NODE_NAMES) {
    if (!nodesMap.has(implicitName)) {
      let uiNode = uiNodesMap.get(implicitName)
      if (!uiNode) {
        if (!needLayout) {
          needLayout = true
        }
        uiNode = makeDefaultImplicitUINode(implicitName)
      }

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

    // TODO(Makito): Check if the connection is in sync with the layout (UI data) and update the needLayout flag as well

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

  return {
    nodes,
    edges,
    needLayout: needLayout && keepHistory ? { keepHistory: true } : needLayout,
  }
}

export function makeNodeInstance(payload: MakeNodeInstancePayload): NodeInstance {
  const { type, name, phase, position, fields, config } = payload
  const defaultFields = getFieldsFromMeta(type)

  return {
    id: createId('node'),
    type,
    name: name ?? (type as ImplicitNodeName),
    phase: phase ?? 'request',
    position: position ?? { x: 0, y: 0 },
    expanded: {},
    fields: {
      input: toFieldArray(fields?.input ?? defaultFields.input),
      output: toFieldArray(fields?.output ?? defaultFields.output),
    },
    config: config ? clone(config) : {},
  }
}

function getDefaultPhase(type: NodeType): NodePhase {
  if (isImplicitType(type)) {
    return type === 'request' || type === 'service_request' ? 'request' : 'response'
  }
  return 'request'
}

export function buildNodeInstance(
  type: NodeType,
  configNode?: ConfigNode,
  uiNode?: UINode,
): NodeInstance {
  return makeNodeInstance({
    type,
    name: configNode?.name,
    phase: uiNode?.phase ?? getDefaultPhase(type),
    position: uiNode?.position,
    fields: resolveFields(type, uiNode, configNode),
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
      if (!connection) continue

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
      if (!connection) continue

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

/**
 * Resolves the input and output fields for a node instance.
 *
 * - If the node type supports configurable IO, prefer the UI node’s fields when available.
 * - Otherwise, return `undefined` so the default fields from metadata are used.
 * - If `unNode` is not provided (e.g. when importing examples or switching to the flow editor
 *   from an existing config), fall back to the config node’s inputs/outputs.
 * - If the config node is of type `static`, also expose its values as output fields.
 */
function resolveFields(
  type: NodeType,
  uiNode?: UINode,
  configNode?: ConfigNode,
): MakeNodeInstancePayload['fields'] | undefined {
  const meta = getNodeMeta(type)
  const io = meta?.io
  if (!io) return undefined

  const fields: MakeNodeInstancePayload['fields'] = {}

  if (io.input?.configurable) {
    if (uiNode) {
      fields.input = uiNode.fields?.input ?? []
    } else if (configNode?.inputs) {
      fields.input = Object.keys(configNode.inputs) as FieldName[]
    }
  }

  if (io.output?.configurable) {
    if (uiNode) {
      fields.output = uiNode.fields?.output ?? []
    } else {
      const out = new Set<FieldName>()
      if (configNode?.outputs) {
        Object.keys(configNode.outputs).forEach((fieldName) => out.add(fieldName as FieldName))
      }

      if (configNode?.type === 'static') {
        if (configNode.values) {
          Object.keys(configNode.values).forEach((fieldName) => out.add(fieldName as FieldName))
        }
      }
      if (out.size) fields.output = Array.from(out)
    }
  }

  return Object.keys(fields).length ? fields : undefined
}
