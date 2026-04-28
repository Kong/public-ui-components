const konnectV1BaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/v1'
const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
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
      availablePlugins: `${konnectV1BaseApiUrl}/available-plugins`,
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
      // VFG endpoints24
      entityGetOne: `${konnectBaseApiUrl}/{entity}/{id}`,
      entityGetAll: `${konnectBaseApiUrl}/{entity}`,
      entityPeek: `${konnectBaseApiUrl}/{entity}?size={amount}`,
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
      // VFG endpoints
      entityGetOne: `${KMBaseApiUrl}/{entity}/{id}`,
      entityGetAll: `${KMBaseApiUrl}/{entity}`,
    },
  },
  customPlugin: {
    konnect: {
      installed: {
        create: `${konnectBaseApiUrl}/plugin-schemas`,
        edit: `${konnectBaseApiUrl}/plugin-schemas/{pluginId}`,
      },
      streamed: {
        create: `${konnectBaseApiUrl}/custom-plugins`,
        edit: `${konnectBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${konnectBaseApiUrl}/cloned-plugins/{pluginId}`,
        edit: `${konnectBaseApiUrl}/cloned-plugins/{pluginId}`,
      },
    },
    kongManager: {
      streamed: {
        create: `${KMBaseApiUrl}/custom-plugins`,
        edit: `${KMBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${KMBaseApiUrl}/cloned-plugins/{pluginId}`,
        edit: `${KMBaseApiUrl}/cloned-plugins/{pluginId}`,
      },
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
