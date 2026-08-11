import type { RouteLocationRaw } from 'vue-router'
import type { FilterSchema, KongManagerBaseTableConfig, KonnectBaseTableConfig } from '@kong-ui-public/entities-shared'

import type { EntityType } from './plugin'
import type { EntityRow as ServiceEntity } from '@kong-ui-public/entities-gateway-services'
import type { EntityRow as ConsumerEntity } from '@kong-ui-public/entities-consumers'
import type { EntityRow as RouteEntity } from '@kong-ui-public/entities-routes'
import type { EntityRow as ConsumerGroupEntity } from '@kong-ui-public/entities-consumer-groups'

export type ViewRouteType = 'consumer' | 'route' | 'service' | 'consumer_group'

export interface EntityRow extends Record<string, any> {
  config: any
  created_at: number
  enabled: boolean
  id: string
  name: string
  protocols: string[]
  tags?: string[] | null
  ordering?: any | null
  instance_name?: string | null

  consumer?: Pick<ConsumerEntity, 'id'> | null
  route?: Pick<RouteEntity, 'id'> | null
  service?: Pick<ServiceEntity, 'id'> | null
  consumer_group?: Pick<ConsumerGroupEntity, 'id'> | null
}

export interface BasePluginListConfig {
  /** Current entity type and id for plugins for specific entity */
  entityType?: EntityType
  entityId?: string
  /** Route for creating a plugin */
  createRoute: RouteLocationRaw
  /** A function that returns the route for viewing a plugin */
  getViewRoute: (plugin: EntityRow) => RouteLocationRaw
  /** A function that returns the route for editing a plugin */
  getEditRoute: (plugin: EntityRow) => RouteLocationRaw
  /** A function that returns the route for the specific entity linked with plugin */
  getScopedEntityViewRoute?: (type: ViewRouteType, id: string) => RouteLocationRaw
  /** A function that returns the route for plugin's dynamic ordering confiugration page */
  getConfigureDynamicOrderingRoute: (plugin: EntityRow) => RouteLocationRaw
  /** An synchronous function, that returns a string for a entity row, will be displayed on the switch hover tooltip */
  getToggleDisabledTooltip?: (plugin: EntityRow) => string | null
}

/** Konnect-only: independently toggleable pieces of the plugin list improvement epic. Each defaults to false/undefined = current behavior. `sorting` and `bulkActions` only take effect when `filtering` is also on, since they build on the redesigned table layout it introduces. */
export interface PluginTableImprovementFlags {
  /** Enables the redesigned table (search API, Name/Scope/Status/Ordering columns, KFilterGroup toolbar). */
  filtering?: boolean
  /** Enables column sorting on the redesigned table. Requires `filtering`. */
  sorting?: boolean
  /** Enables bulk row selection/actions on the redesigned table. Requires `filtering`. */
  bulkActions?: boolean
}

/** Konnect plugin list config */
export interface KonnectPluginListConfig extends KonnectBaseTableConfig, BasePluginListConfig {
  /** Konnect-only: flags for the plugin list improvement, rolled out incrementally. */
  pluginTableImprovements?: PluginTableImprovementFlags
}

/** Kong Manager plugin list config */
export interface KongManagerPluginListConfig extends KongManagerBaseTableConfig, BasePluginListConfig {
  /** FilterSchema for fuzzy match */
  filterSchema?: FilterSchema
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
