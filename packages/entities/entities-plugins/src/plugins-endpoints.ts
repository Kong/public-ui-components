export default {
  list: {
    konnect: {
      all: '/api/runtime_groups/{controlPlaneId}/plugins',
      forEntity: '/api/runtime_groups/{controlPlaneId}/{entityType}/{entityId}/plugins',
    },
    kongManager: {
      all: '/{workspace}/plugins',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins',
    },
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/plugins',
      edit: '/api/runtime_groups/{controlPlaneId}/plugins/{id}',
      pluginSchema: '/api/runtime_groups/{controlPlaneId}/schemas/plugins/{plugin}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/plugin/validate',
    },
    kongManager: {
      create: '/{workspace}/plugins',
      edit: '/{workspace}/plugins/{id}',
      pluginSchema: '/{workspace}/schemas/plugins/{plugin}',
      validate: '/{workspace}/schemas/plugins/validate',
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
