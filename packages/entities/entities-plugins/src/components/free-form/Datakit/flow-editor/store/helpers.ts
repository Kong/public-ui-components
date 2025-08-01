import type {
  EdgeId,
  FieldId,
  FieldName,
  NodePhase,
  ImplicitNodeName,
  NodeInstance,
  NodeField,
  NodeId,
  NodeName,
  NodeType,
  UINode,
  ConfigNodeType,
  ConfigNodeName,
} from '../../types'
import {
  CONFIG_NODE_META_MAP,
  IMPLICIT_NODE_META_MAP,
  isImplicitType,
} from '../node/node'

let idCounter = 0

/** Deep clone for snapshots and immutable returns. */
export function deepClone<T>(value: T): T {
  // TODO: move to lodash or similar utility library
  return JSON.parse(JSON.stringify(value))
}

/** Generate a unique runtime id. */
export function createId<T extends 'node' | 'edge' | 'field'>(
  type: T,
): T extends 'node' ? NodeId : T extends 'edge' ? EdgeId : FieldId {
  return `${type}:${idCounter++}` as unknown as T extends 'node'
    ? NodeId
    : T extends 'edge'
      ? EdgeId
      : FieldId
}

/** Parse "NODE" or "NODE.FIELD". */
export function parseConnection(connection: string): {
  nodeName: NodeName
  fieldName?: FieldName
} {
  const [nodeName, fieldName] = connection.split('.') as [
    NodeName,
    FieldName | undefined,
  ]
  return { nodeName, fieldName }
}

/** Default field names from node meta. */
export function getFieldsFromMeta(type: NodeType): {
  input: FieldName[]
  output: FieldName[]
} {
  const meta = isImplicitType(type)
    ? IMPLICIT_NODE_META_MAP[type]
    : CONFIG_NODE_META_MAP[type]

  const input = meta.io?.input?.fields?.map(({ name }) => name) ?? []
  const output = meta.io?.output?.fields?.map(({ name }) => name) ?? []
  return { input, output }
}

/** Build NodeField array from names. */
export function toFieldArray(names?: FieldName[]): NodeField[] {
  return (names ?? []).map((name) => ({ id: createId('field'), name }))
}

/** Find a field by visible name. */
export function findFieldByName(
  node: NodeInstance,
  io: 'input' | 'output',
  name?: FieldName,
): NodeField | undefined {
  if (!name) return undefined
  return node.fields[io].find((field) => field.name === name)
}

/** Find a field by id. */
export function findFieldById(
  node: NodeInstance,
  io: 'input' | 'output',
  id?: FieldId,
): NodeField | undefined {
  if (!id) return undefined
  return node.fields[io].find((field) => field.id === id)
}

/** Quick checks for handle type. */
export function hasOutputField(node: NodeInstance, fieldId?: FieldId): boolean {
  if (!fieldId) return true
  return node.fields.output.some((field) => field.id === fieldId)
}
export function hasInputField(node: NodeInstance, fieldId?: FieldId): boolean {
  if (!fieldId) return true
  return node.fields.input.some((field) => field.id === fieldId)
}

/** The 4 implicit nodes always present. */
export const IMPLICIT_NODE_NAMES: ImplicitNodeName[] = [
  'request',
  'service_request',
  'service_response',
  'response',
]

/** Default UI blob for an implicit node. */
export function makeDefaultImplicitUINode(name: ImplicitNodeName): UINode {
  const phase: NodePhase =
    name === 'request' || name === 'service_request' ? 'request' : 'response'
  const meta = IMPLICIT_NODE_META_MAP[name]
  return {
    name,
    phase,
    position: { x: 0, y: 0 },
    fields: getFieldsFromMeta(meta.type),
    expanded: {},
  }
}

/** Generate a unique node name when user doesn’t supply one. */
export function generateNodeName(
  type: ConfigNodeType,
  nodeNames: Set<NodeName>,
): ConfigNodeName {
  const prefix = type.toUpperCase()

  let next = 1
  while (true) {
    if (!nodeNames.has(`${prefix}_${next}` as ConfigNodeName)) break
    next++
  }

  return `${prefix}_${next}` as ConfigNodeName
}
