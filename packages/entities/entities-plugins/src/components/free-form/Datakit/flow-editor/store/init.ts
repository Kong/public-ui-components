import type {
  ConfigNode,
  EditorState,
  EdgeInstance,
  NodePhase,
  ImplicitNodeName,
  NodeInstance,
  NodeName,
  NodeType,
  UINode,
  FieldName,
  ConfigEdge,
} from '../../types'
import {
  createId,
  deepClone,
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

  return { nodes, edges }
}

export function makeNodeInstance(payload: {
  type: NodeType
  name?: NodeName
  phase?: NodePhase
  position?: { x: number, y: number }
  uiFieldNames?: { input?: FieldName[], output?: FieldName[] }
  config?: Record<string, unknown>
}): NodeInstance {
  const { type, name, phase, position, uiFieldNames, config } = payload
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
      input: toFieldArray(uiFieldNames?.input ?? defaults.input),
      output: toFieldArray(uiFieldNames?.output ?? defaults.output),
    },
    config: config ? deepClone(config) : {},
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
    uiFieldNames: uiNode?.fields,
    config: configNode ? extractConfig(configNode) : undefined,
  })
}

/** Strip identity and IO fields. */
export function extractConfig(configNode: ConfigNode): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, name, input, inputs, output, outputs, ...rest } = configNode
  return deepClone(rest)
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
