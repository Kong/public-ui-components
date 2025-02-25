const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/plugins`,
      forEntity: `${konnectBaseApiUrl}/{entityType}/{entityId}/plugins`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/plugins`,
      forEntity: `${KMBaseApiUrl}/{entityType}/{entityId}/plugins`,
    },
  },
  select: {
    konnect: {
      availablePlugins: `${konnectBaseApiUrl}/v1/available-plugins`,
      streamingCustomPlugins: `${konnectBaseApiUrl}/custom-plugins`,
      schemaCustomPluginItem: `${konnectBaseApiUrl}/plugin-schemas/{pluginId}`,
      streamingCustomPluginItem: `${konnectBaseApiUrl}/custom-plugins/{pluginId}`,
    },
    kongManager: {
      availablePlugins: `${KMBaseApiUrl}/kong`,
      availablePluginsForOss: '/',
    },
  },
  form: {
    konnect: {
      create: {
        all: `${konnectBaseApiUrl}/plugins`,
        forEntity: `${konnectBaseApiUrl}/{entityType}/{entityId}/plugins`,
      },
      edit: {
        all: `${konnectBaseApiUrl}/plugins/{id}`,
        forEntity: `${konnectBaseApiUrl}/{entityType}/{entityId}/plugins/{id}`,
      },
      pluginSchema: '/v2/control-planes/{controlPlaneId}/schemas/core-entities/plugins/{plugin}',
      credential: {
        create: `${konnectBaseApiUrl}/{resourceEndpoint}`,
        edit: `${konnectBaseApiUrl}/{resourceEndpoint}/{id}`,
      },
      credentialSchema: '/v2/control-planes/{controlPlaneId}/schemas/core-entities/{plugin}',
      validate: `${konnectBaseApiUrl}/v1/schemas/json/plugin/validate`,
      // VFG endpoints24
      entityGetOne: `${konnectBaseApiUrl}/{entity}/{id}`,
      entityGetAll: `${konnectBaseApiUrl}/{entity}?size=1000`,
    },
    kongManager: {
      create: {
        all: `${KMBaseApiUrl}/plugins`,
        forEntity: `${KMBaseApiUrl}/{entityType}/{entityId}/plugins`,
      },
      edit: {
        all: `${KMBaseApiUrl}/plugins/{id}`,
        forEntity: `${KMBaseApiUrl}/{entityType}/{entityId}/plugins/{id}`,
      },
      pluginSchema: `${KMBaseApiUrl}/schemas/plugins/{plugin}`,
      credential: {
        create: `${KMBaseApiUrl}/{resourceEndpoint}`,
        edit: `${KMBaseApiUrl}/{resourceEndpoint}/{id}`,
      },
      credentialSchema: `${KMBaseApiUrl}/schemas/{plugin}`,
      validate: `${KMBaseApiUrl}/schemas/plugins/validate`,
      // VFG endpoints
      entityGetOne: `${KMBaseApiUrl}/{entity}/{id}`,
      entityGetAll: `${KMBaseApiUrl}/{entity}`,
    },
  },
  item: {
    konnect: {
      all: `${konnectBaseApiUrl}/plugins/{id}`,
      forEntity: `${konnectBaseApiUrl}/{entityType}/{entityId}/plugins/{id}`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/plugins/{id}`,
      forEntity: `${KMBaseApiUrl}/{entityType}/{entityId}/plugins/{id}`,
    },
  },
}
