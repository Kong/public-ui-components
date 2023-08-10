// Export all types and interfaces from this index.ts
// The actual types and interfaces should be contained in separate files within this folder.

export * from './upstreams-list'
export * from './targets-list'
export * from './target-form'
export * from './upstreams-form'
export * from './upstreams-config'

export interface EntityRow extends Record<string, any> {
  id: string
}

/** Copy field event payload */
export interface CopyEventPayload {
  /** The entity row */
  entity: EntityRow
  /** The field being copied. If omitted, the entity JSON is being copied. */
  field?: string
  /** The toaster message */
  message: string
}
