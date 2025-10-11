import type { XYPosition } from '@vue-flow/core'
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
  NameConnection,
  IdConnection,
  GroupId,
  GroupName,
  GroupInstance,
  NodeDimensions,
} from '../../types'
import { cloneDeep, uniqueId } from 'lodash-es'
import {
  CONFIG_NODE_META_MAP,
  IMPLICIT_NODE_META_MAP,
  isConfigType,
  isImplicitType,
  isNodeType,
} from '../node/node'
import type { BranchName } from '../../schema/strict'

/** Deep clone for snapshots and immutable returns. */
export function clone<T>(value: T): T {
  return cloneDeep(value)
}

/**
 * Check if two arrays contain the same elements, ignoring order.
 *
 * @example
 * setsEqual([1, 2, 3], [3, 2, 1]) // true
 * setsEqual([1, 2], [1, 2, 3]) // false
 */
export function setsEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false
  if (a.length === 0) return true

  const setB = new Set(b)
  return a.every(item => setB.has(item))
}

/** Generate a unique runtime id. */
export function createId(type: 'node'): NodeId
export function createId(type: 'edge'): EdgeId
export function createId(type: 'field'): FieldId
export function createId(type: string): string {
  return `${type}:${uniqueId()}`
}

/** Parse "NODE" or "NODE.FIELD". */
export function parseNameConnection(nameConnection: NameConnection): {
  nodeName: NodeName
  fieldName?: FieldName
} {
  const [nodeName, fieldName] = nameConnection.split('.') as [
    NodeName,
    FieldName | undefined,
  ]
  return { nodeName, fieldName }
}

export function parseIdConnection(idConnection: IdConnection): {
  nodeId: NodeId
  fieldId?: FieldId
} {
  const [nodeId, fieldId] = idConnection.split('.') as [
    NodeId,
    FieldId | undefined,
  ]
  return { nodeId, fieldId }
}

export function getNodeMeta(type: NodeType) {
  return isImplicitType(type)
    ? IMPLICIT_NODE_META_MAP[type]
    : CONFIG_NODE_META_MAP[type]
}

/** Default field names from node meta. */
export function getFieldsFromMeta(type: NodeType): {
  input: FieldName[]
  output: FieldName[]
} {
  const meta = getNodeMeta(type)

  const input = meta.io?.input?.fields.map(({ name }) => name) ?? []
  const output = meta.io?.output?.fields.map(({ name }) => name) ?? []
  return { input, output }
}

export function getBranchesFromMeta(type: NodeType): BranchName[] {
  const meta = getNodeMeta(type)
  return meta.io?.next?.branches?.map(({ name }) => name) ?? []
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
    ['request', 'service_request', 'vault'].includes(name) ? 'request' : 'response'
  const meta = IMPLICIT_NODE_META_MAP[name]
  return {
    name,
    phase,
    position: { x: 0, y: 0 },
    fields: getFieldsFromMeta(meta.type),
    expanded: {},
    hidden: meta.hidden,
  }
}

/** Generate a unique node name when user doesn’t supply one. */
export function generateNodeName(
  prefixOrType: ConfigNodeType | string,
  nodeNames: ReadonlySet<NodeName>,
): ConfigNodeName {
  const base = (typeof prefixOrType === 'string' && isNodeType(prefixOrType))
    ? prefixOrType.toUpperCase()
    : prefixOrType
  const prefix = base.replace(/_\d+$/, '')

  for (let n = 1; ; n++) {
    const name = `${prefix}_${n}` as ConfigNodeName
    if (!nodeNames.has(name)) return name
  }
}

export function makeGroupId(nodeId: NodeId, branch: BranchName): GroupId {
  return `${nodeId}:${branch}` as GroupId
}

export function parseGroupId(groupId: GroupId): { nodeId: NodeId, branch: BranchName } {
  const lastColon = groupId.lastIndexOf(':')
  if (lastColon === -1) {
    throw new Error(`Invalid group ID format: ${groupId}`)
  }
  const nodeId = groupId.slice(0, lastColon) as NodeId
  const branch = groupId.slice(lastColon + 1) as BranchName
  return { nodeId, branch }
}

export function makeGroupName(nodeName: NodeName, branch: BranchName): GroupName {
  return `${nodeName}:${branch}` as GroupName
}

export function parseGroupName(name: GroupName): { nodeName: NodeName, branch: BranchName } {
  const lastColon = name.lastIndexOf(':')
  if (lastColon === -1) {
    throw new Error(`Invalid group name format: ${name}`)
  }
  const nodeName = name.slice(0, lastColon) as NodeName
  const branch = name.slice(lastColon + 1) as BranchName
  return { nodeName, branch }
}

export function toGroupInstance(
  nodeId: NodeId,
  branch: BranchName,
  phase: NodePhase,
  memberIds: NodeId[],
  layout?: {
    position?: XYPosition
    dimensions?: NodeDimensions
  },
): GroupInstance {
  return {
    id: makeGroupId(nodeId, branch),
    ownerId: nodeId,
    branch,
    phase,
    memberIds: [...memberIds],
    position: layout?.position ? { ...layout.position } : undefined,
    dimensions: layout?.dimensions ? { ...layout.dimensions } : undefined,
  }
}
