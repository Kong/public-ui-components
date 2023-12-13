export default {
  list: {
    konnect: {
      all: '/v2/control-planes/{controlPlaneId}/core-entities/plugins',
      forEntity: '/v2/control-planes/{controlPlaneId}/core-entities/{entityType}/{entityId}/plugins',
    },
    kongManager: {
      all: '/{workspace}/plugins',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins',
    },
  },
  select: {
    konnect: {
      availablePlugins: '/v2/control-planes/{controlPlaneId}/core-entities/v1/available-plugins',
    },
    kongManager: {
      availablePlugins: '/{workspace}/kong',
      availablePluginsForOss: '/',
    },
  },
  form: {
    konnect: {
      create: '/v2/control-planes/{controlPlaneId}/core-entities/plugins',
      edit: '/v2/control-planes/{controlPlaneId}/core-entities/plugins/{id}',
      pluginSchema: '/v2/control-planes/{controlPlaneId}/schemas/core-entities/plugins/{plugin}',
      credential: {
        create: '/v2/control-planes/{controlPlaneId}/core-entities/{resourceEndpoint}',
        edit: '/v2/control-planes/{controlPlaneId}/core-entities/{resourceEndpoint}/{id}',
      },
      credentialSchema: '/v2/control-planes/{controlPlaneId}/schemas/core-entities/{plugin}',
      validate: '/v2/control-planes/{controlPlaneId}/core-entities/v1/schemas/json/plugin/validate',
      // VFG endpoints24
      entityGetOne: '/v2/control-planes/{controlPlaneId}/core-entities/{entity}/{id}',
      entityGetAll: '/v2/control-planes/{controlPlaneId}/core-entities/{entity}?size=1000',
    },
    kongManager: {
      create: '/{workspace}/plugins',
      edit: '/{workspace}/plugins/{id}',
      pluginSchema: '/{workspace}/schemas/plugins/{plugin}',
      credential: {
        create: '/{workspace}/{resourceEndpoint}',
        edit: '/{workspace}/{resourceEndpoint}/{id}',
      },
      credentialSchema: '/{workspace}/schemas/{plugin}',
      validate: '/{workspace}/schemas/plugins/validate',
      // VFG endpoints
      entityGetOne: '/{workspace}/{entity}/{id}',
      entityGetAll: '/{workspace}/{entity}',
    },
  },
  item: {
    konnect: {
      all: '/v2/control-planes/{controlPlaneId}/core-entities/plugins/{id}',
      forEntity: '/v2/control-planes/{controlPlaneId}/core-entities/{entityType}/{entityId}/plugins/{id}',
    },
    kongManager: {
      all: '/{workspace}/plugins/{id}',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins/{id}',
    },
  },
}
