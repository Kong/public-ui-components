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
  AUTHENTICATION: true,
  SECURITY: true,
  TRAFFIC_CONTROL: true,
  SERVERLESS: true,
  ANALYTICS_AND_MONITORING: true,
  TRANSFORMATIONS: true,
  LOGGING: true,
  DEPLOYMENT: true,
  CUSTOM_PLUGINS: true,
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

export type PluginMetaData = {
  description: string // A string to describe a Plugin.
  docsUrlName?: string // An optional field for plugin's documentation URL.
  group: PluginGroup // Plugin categories meta.
  imageName?: string // An optional tag to define plugin's icon image.
  isEnterprise: boolean // The value will be True if the Plugin is enterprise only.
  name: string // A display name of the Plugin.
  scope: PluginScope[] // The scope supported by the Plugin.
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
