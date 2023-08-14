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
  CUSTOM_PLUGINS = 'Other Plugins',
}

export enum PluginScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  ROUTE = 'route',
  CONSUMER = 'consumer',
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
