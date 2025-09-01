import type { NodeInstance, FieldId, EdgeInstance, NodeId } from '../../types'
import type { ConnectionString } from '../modal/ConflictModal.vue'
import { findFieldById } from '../store/helpers'

/**
 * Create a formatted node connection string for display purposes.
 * Format: "nodeName" or "nodeName.fieldName" for field-specific connections.
 */
export function formatNodeConnection(
  node: NodeInstance,
  fieldId: FieldId | undefined,
  fieldType: 'input' | 'output',
): string {
  const field = fieldId ? findFieldById(node, fieldType, fieldId) : undefined
  return `${node.name}${field ? `.${field.name}` : ''}`
}

/**
 * Create a connection string representation for an edge for display purposes.
 * Returns a tuple of [source, target] connection strings.
 */
export function createEdgeConnectionString(
  edge: EdgeInstance,
  getNodeById: (id: NodeId) => NodeInstance | undefined,
): ConnectionString {
  const sourceNode = getNodeById(edge.source)!
  const targetNode = getNodeById(edge.target)!

  return [
    formatNodeConnection(sourceNode, edge.sourceField, 'output'),
    formatNodeConnection(targetNode, edge.targetField, 'input'),
  ]
}

/**
 * Create a connection string representation for a new connection for display purposes.
 * Returns a tuple of [source, target] connection strings.
 */
export function createNewConnectionString(
  sourceId: NodeId,
  sourceFieldId: FieldId | undefined,
  targetId: NodeId,
  targetFieldId: FieldId | undefined,
  getNodeById: (id: NodeId) => NodeInstance | undefined,
): ConnectionString {
  const sourceNode = getNodeById(sourceId)!
  const targetNode = getNodeById(targetId)!

  return [
    formatNodeConnection(sourceNode, sourceFieldId, 'output'),
    formatNodeConnection(targetNode, targetFieldId, 'input'),
  ]
}
