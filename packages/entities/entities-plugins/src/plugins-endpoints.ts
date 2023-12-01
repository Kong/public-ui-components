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
      availablePlugins: '/api/runtime_groups/{controlPlaneId}/v1/available-plugins',
    },
    kongManager: {
      availablePlugins: '/{workspace}/kong',
    },
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/plugins',
      edit: '/v2/control-planes/{controlPlaneId}/core-entities/plugins/{id}',
      pluginSchema: '/api/runtime_groups/{controlPlaneId}/schemas/plugins/{plugin}',
      credential: {
        create: '/api/runtime_groups/{controlPlaneId}/{resourceEndpoint}',
        edit: '/v2/control-planes/{controlPlaneId}/core-entities/{resourceEndpoint}/{id}',
      },
      credentialSchema: '/api/runtime_groups/{controlPlaneId}/schemas/{plugin}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/plugin/validate',
      // VFG endpoints
      entityGetOne: '/api/runtime_groups/{controlPlaneId}/{entity}/{id}',
      entityGetAll: '/api/runtime_groups/{controlPlaneId}/{entity}?size=1000',
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
      all: '/api/runtime_groups/{controlPlaneId}/plugins/{id}',
      forEntity: '/api/runtime_groups/{controlPlaneId}/{entityType}/{entityId}/plugins/{id}',
    },
    kongManager: {
      all: '/{workspace}/plugins/{id}',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins/{id}',
    },
  },
}
