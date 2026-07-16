const konnectV1BaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/v1'
const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const konnectNoWorkspaceBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
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
  search: {
    konnect: {
      all: `${konnectNoWorkspaceBaseApiUrl}/plugins/search`,
    },
  },
  select: {
    konnect: {
      availablePlugins: `${konnectV1BaseApiUrl}/available-plugins`,
      streamingCustomPlugins: `${konnectNoWorkspaceBaseApiUrl}/custom-plugins`,
      clonedPlugins: `${konnectNoWorkspaceBaseApiUrl}/cloned-plugins`,
      schemaCustomPluginItem: `${konnectNoWorkspaceBaseApiUrl}/plugin-schemas/{pluginId}`,
      streamingCustomPluginItem: `${konnectNoWorkspaceBaseApiUrl}/custom-plugins/{pluginId}`,
    },
    kongManager: {
      availablePlugins: `${KMBaseApiUrl}/kong`,
      availablePluginsForOss: '/',
      streamingCustomPlugins: `${KMBaseApiUrl}/custom-plugins`,
      clonedPlugins: `${KMBaseApiUrl}/cloned-plugins`,
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
      pluginSchema: '/v2/control-planes/{controlPlaneId}/core-entities/schemas/plugins/{plugin}',
      credential: {
        create: `${konnectBaseApiUrl}/{resourceEndpoint}`,
        edit: `${konnectBaseApiUrl}/{resourceEndpoint}/{id}`,
      },
      credentialSchema: '/v2/control-planes/{controlPlaneId}/core-entities/schemas/{plugin}',
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
        create: `${konnectNoWorkspaceBaseApiUrl}/plugin-schemas`,
        edit: `${konnectNoWorkspaceBaseApiUrl}/plugin-schemas/{pluginId}`,
      },
      streamed: {
        create: `${konnectNoWorkspaceBaseApiUrl}/custom-plugins`,
        edit: `${konnectNoWorkspaceBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${konnectNoWorkspaceBaseApiUrl}/cloned-plugins`,
        edit: `${konnectNoWorkspaceBaseApiUrl}/cloned-plugins/{pluginId}`,
      },
    },
    kongManager: {
      streamed: {
        create: `${KMBaseApiUrl}/custom-plugins`,
        edit: `${KMBaseApiUrl}/custom-plugins/{pluginId}`,
      },
      cloned: {
        create: `${KMBaseApiUrl}/cloned-plugins`,
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
