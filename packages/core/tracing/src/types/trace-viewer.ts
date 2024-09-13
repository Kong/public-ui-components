import type { EntityLinkData } from '@kong-ui-public/entities-shared'

export interface TraceViewerConfig {
  /**
   * A function that builds the URL to the entity page in the UI.
   *
   * @param entity entity type (e.g. 'services')
   * @param entityId entity ID
   * @param plugin plugin name; only available when entity is 'plugins' (e.g. 'basic-auth')
   * @returns the URL to the entity page in the UI
   */
  buildEntityLink?: (entity: string, entityId: string, plugin?: string) => string
  /**
   * A function that fetches the entity record and return the EntityLinkData for the link display.
   *
   * @param entity entity type (e.g. 'services')
   * @param entityId entity ID
   * @param abortSignal an AbortSignal object to abort the request
   * @returns the EntityLinkData object
   */
  getEntityLinkData?: (entity: string, entityId: string, abortSignal: AbortSignal) => Promise<EntityLinkData>
}
