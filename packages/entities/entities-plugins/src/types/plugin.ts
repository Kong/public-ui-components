import type { PathToDotNotation } from '@kong-ui-public/i18n/dist/types/types'

export enum PluginGroup {
  AUTHENTICATION = 'Authentication',
  SECURITY = 'Security',
  TRAFFIC_CONTROL = 'Traffic Control',
  SERVERLESS = 'Serverless',
  ANALYTICS_AND_MONITORING = 'Analytics & Monitoring',
  TRANSFORMATIONS = 'Transformations',
  LOGGING = 'Logging',
  DEPLOYMENT = 'Deployment',
  WEBSOCKET = 'WebSocket Plugins',
  CUSTOM_PLUGINS = 'Custom Plugins',
}

export const PluginGroupArray = [
  PluginGroup.AUTHENTICATION,
  PluginGroup.SECURITY,
  PluginGroup.TRAFFIC_CONTROL,
  PluginGroup.SERVERLESS,
  PluginGroup.ANALYTICS_AND_MONITORING,
  PluginGroup.TRANSFORMATIONS,
  PluginGroup.LOGGING,
  PluginGroup.DEPLOYMENT,
  PluginGroup.WEBSOCKET,
  PluginGroup.CUSTOM_PLUGINS,
]

export const PLUGIN_GROUPS_COLLAPSE_STATUS = {
  [PluginGroup.AUTHENTICATION]: false,
  [PluginGroup.SECURITY]: false,
  [PluginGroup.TRAFFIC_CONTROL]: false,
  [PluginGroup.SERVERLESS]: false,
  [PluginGroup.ANALYTICS_AND_MONITORING]: false,
  [PluginGroup.TRANSFORMATIONS]: false,
  [PluginGroup.LOGGING]: false,
  [PluginGroup.DEPLOYMENT]: false,
  [PluginGroup.CUSTOM_PLUGINS]: false,
}

// this is the entity associated with a specific plugin, if no associated entity, then it's a global plugin meaning EntityType will be 'plugins'
export type EntityType = 'consumers' | 'routes' | 'services' | 'consumer_groups' | 'plugins'
export enum EntityTypeIdField {
  SERVICE = 'service_id',
  ROUTE = 'route_id',
  CONSUMER = 'consumer_id',
  CONSUMER_GROUP = 'consumer_group_id',
}

export enum PluginScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  ROUTE = 'route',
  CONSUMER = 'consumer',
  CONSUMER_GROUP = 'consumer_group',
}

export interface PluginEntityInfo {
  entity: PluginScope
  entityEndpoint: EntityType
  id?: string
  idField?: EntityTypeIdField
}

export interface FieldChecks {
  atLeastOneOf?: string[][] // aligned with `at_least_one_of` in BE schema
  onlyOneOf?: string[][] // aligned with `only_one_of` in BE schema
  mutuallyRequired?: string[][] // aligned with `mutually_required` in BE schema

  /**
   * Require EXACTLY one parameter among the parameters.
   *
   * NOTE: This does not have a corresponding BE check.
   */
  exactOneOf?: string[][]

  /**
   * Require EXACTLY one COMBINATION of parameters.
   * Parameters in each COMBINATION are mutually required.
   *
   * NOTE: This does not have a corresponding BE check.
   */
  exactOneOfMutuallyRequired?: string[][][]
}

export type PluginMetaData<I18nMessageSource = void> = {
  nameKey: I18nMessageSource extends void ? string : PathToDotNotation<I18nMessageSource, string>
  name: string // A display name of the Plugin.
  descriptionKey: I18nMessageSource extends void ? string : PathToDotNotation<I18nMessageSource, string>
  description: string // A string to describe a Plugin.
  group: PluginGroup // Plugin categories meta.
  scope: PluginScope[] // The scope supported by the Plugin.
  isEnterprise: boolean // The value will be True if the Plugin is enterprise only.
  imageName?: string // An optional tag to define plugin's icon image.
  fieldChecks?: FieldChecks
}

export interface PluginType extends PluginMetaData {
  id: string // the plugin schema name
  available?: boolean // whether the plugin is available or not
  exists?: boolean // whether the plugin exists already for the current entity
  disabledMessage?: string // An optional field for plugin's disabled message.
}

export type DisabledPlugin = {
  [key: string]: string // [plugin.id]: plugin.disabledMessage
}

export type PluginCardList = {
  [key in PluginGroup]?: PluginType[]
}

export type TriggerLabels = {
  [key in PluginGroup]?: string // [plugin.group]: label
}
