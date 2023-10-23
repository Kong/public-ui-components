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

export enum PluginScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  ROUTE = 'route',
  CONSUMER = 'consumer',
  CONSUMER_GROUP = 'consumer_group',
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
  available: boolean // whether the plugin is available or not
  disabledMessage?: string // An optional field for plugin's disabled message.
  id: string // the plugin schema name
}
