export enum PluginGroup {
  FEATURED = 'Featured',
  AUTHENTICATION = 'Authentication',
  AI = 'AI',
  SECURITY = 'Security',
  TRAFFIC_CONTROL = 'Traffic control',
  SERVERLESS = 'Serverless',
  ANALYTICS_AND_MONITORING = 'Analytics & Monitoring',
  TRANSFORMATIONS = 'Transformations',
  LOGGING = 'Logging',
  DEPLOYMENT = 'Deployment',
  WEBSOCKET = 'WebSocket Plugins',
  CUSTOM_PLUGINS = 'Custom',
  MONETIZATION = 'Monetization',
}

export enum PluginScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  ROUTE = 'route',
  CONSUMER = 'consumer',
  CONSUMER_GROUP = 'consumer_group',
}
