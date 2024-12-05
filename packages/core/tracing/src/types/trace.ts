import type { EntityLinkData } from '@kong-ui-public/entities-shared'
import type { Span } from './spans'

export interface ScopeSpan {
  scope: any // don't care for now
  spans: Span[]
}

export interface TraceBatch {
  resource: any // don't care for now
  scopeSpans: ScopeSpan[]
}

export interface TraceBatches {
  batches: TraceBatch[]
}

/**
 * EntityRequest is used to fetch the link and data for an entity in the host app.
 */
export interface EntityRequest {
  /**
   * The name of the entity type in plural form  (e.g., 'services', 'routes', 'consumers').
   */
  entity: string
  /**
   * The ID of the entity.
   */
  entityId: string
  /**
   * The name of the plugin type (e.g., 'basic-auth').
   * This field is only available for entities of the 'plugins' type.
   */
  plugin?: string
  /**
   * The ID of the upstream.
   * This field is only available for entities of the 'targets' type.
   */
  upstream?: string
}

export interface TraceViewerConfig {
  /**
   * A function that builds the URL to the entity page in the UI.
   *
   * The host app **MUST** handle exceptions during the operation and return `undefined` if some error
   * occurred. Ideally, the host SHOULD notify the user (e.g., with a toast) about the condition.
   *
   * @param entityRequest an EntityRequest object
   * @returns a URL as a string or `undefined`
   */
  buildEntityLink?: (request: EntityRequest) => string | undefined
  /**
   * A function that fetches the entity record and return the EntityLinkData for the link display.
   *
   * The host app **MUST** handle exceptions during the operation and return `undefined` if some error
   * occurred. Ideally, the host SHOULD notify the user (e.g., with a toast) about the condition.
   *
   * @param entityRequest an EntityRequest object
   * @param abortSignal an AbortSignal object to abort the request
   * @returns an EntityLinkData object or `undefined`
   */
  getEntityLinkData?: (entityRequest: EntityRequest, abortSignal: AbortSignal) => Promise<EntityLinkData | undefined>
}
