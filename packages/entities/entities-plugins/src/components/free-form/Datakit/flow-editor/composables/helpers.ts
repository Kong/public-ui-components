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
 * Calculate the minimal bounding rectangle that contains every rect in the array.
 *
 * @throws {RangeError} When the rect array is empty or any rect has invalid values.
 */
export function getBoundingRect(rects: readonly Rect[]): Rect {
  if (rects.length === 0) {
    throw new Error('getBoundingRect requires at least one rect')
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const { x, y, width, height } of rects) {
    if (![x, y, width, height].every(Number.isFinite)) {
      throw new Error('Rect values must be finite numbers')
    }
    if (width < 0 || height < 0) {
      throw new RangeError('Rect width and height must be non-negative')
    }

    const right = x + width
    const bottom = y + height

    if (!Number.isFinite(right) || !Number.isFinite(bottom)) {
      throw new RangeError('Rect boundaries must be finite numbers')
    }

    if (x < minX) minX = x
    if (y < minY) minY = y
    if (right > maxX) maxX = right
    if (bottom > maxY) maxY = bottom
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
