export default {
  list: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/plugins',
      forEntity: '/api/control_planes/{controlPlaneId}/{entityType}/{entityId}/plugins',
    },
    kongManager: {
      all: '/{workspace}/plugins',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins',
    },
  },
  form: {
    konnect: {
      edit: '/api/control_planes/{controlPlaneId}/plugins/{id}',
      pluginSchema: '/api/control_planes/{controlPlaneId}/schemas/plugins/{plugin}',
    },
    kongManager: {
      edit: '/{workspace}/plugins/{id}',
      pluginSchema: '/{workspace}/schemas/plugins/{plugin}',
    },
  },
  item: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/plugins/{id}',
      forEntity: '/api/control_planes/{controlPlaneId}/{entityType}/{entityId}/plugins/{id}',
    },
    kongManager: {
      all: '/{workspace}/plugins/{id}',
      forEntity: '/{workspace}/{entityType}/{entityId}/plugins/{id}',
    },
  },
}
