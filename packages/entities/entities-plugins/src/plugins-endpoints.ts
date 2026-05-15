const konnectV1BaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/v1'
const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
// Custom plugins (installed / streamed / cloned) are CP-global and never workspace-scoped.
const konnectGlobalBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'
const KMGlobalBaseApiUrl = ''

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
      streamingCustomPlugins: `${konnectGlobalBaseApiUrl}/custom-plugins`,
      clonedPlugins: `${konnectGlobalBaseApiUrl}/cloned-plugins`,
      schemaCustomPluginItem: `${konnectGlobalBaseApiUrl}/plugin-schemas/{pluginId}`,
      streamingCustomPluginItem: `${konnectGlobalBaseApiUrl}/custom-plugins/{pluginId}`,
    },
    kongManager: {
      availablePlugins: `${KMBaseApiUrl}/kong`,
      availablePluginsForOss: '/',
      streamingCustomPlugins: `${KMGlobalBaseApiUrl}/custom-plugins`,
      clonedPlugins: `${KMGlobalBaseApiUrl}/cloned-plugins`,
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
        create: `${konnectGlobalBaseApiUrl}/plugin-schemas`,
        edit: `${konnectGlobalBaseApiUrl}/plugin-schemas/{pluginId}`,
      },
      streamed: {
        create: `${konnectGlobalBaseApiUrl}/custom-plugins`,
        edit: `${konnectGlobalBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${konnectGlobalBaseApiUrl}/cloned-plugins`,
        edit: `${konnectGlobalBaseApiUrl}/cloned-plugins/{pluginId}`,
      },
    },
    kongManager: {
      streamed: {
        create: `${KMGlobalBaseApiUrl}/custom-plugins`,
        edit: `${KMGlobalBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${KMGlobalBaseApiUrl}/cloned-plugins`,
        edit: `${KMGlobalBaseApiUrl}/cloned-plugins/{pluginId}`,
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
