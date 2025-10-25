import type { NodeInstance, FieldId, EdgeInstance, NodeId, Rect } from '../../types'
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

/**
 * Calculate the minimal bounding rectangle that contains every rect in the iterable.
 */
export function getBoundingRect(rects: Iterable<Rect>): Rect | undefined {
  let minX: number | undefined, minY: number | undefined
  let maxX: number | undefined, maxY: number | undefined

  for (const { x, y, width, height } of rects) {
    if (![x, y, width, height].every(Number.isFinite)) continue
    const x2 = x + width
    const y2 = y + height
    minX = minX === undefined ? x : Math.min(minX, x)
    minY = minY === undefined ? y : Math.min(minY, y)
    maxX = maxX === undefined ? x2 : Math.max(maxX, x2)
    maxY = maxY === undefined ? y2 : Math.max(maxY, y2)
  }

  if (
    minX === undefined
    || minY === undefined
    || maxX === undefined
    || maxY === undefined
    || minX > maxX
    || minY > maxY
  ) {
    return undefined
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
