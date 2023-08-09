export default {
  list: {
    konnect: {
      all: '/api/runtime_groups/{controlPlaneId}/keys',
      forKeySet: '/api/runtime_groups/{controlPlaneId}/key-sets/{keySetId}/keys',
    },
    kongManager: {
      all: '/{workspace}/keys',
      forKeySet: '/{workspace}/key-sets/{keySetId}/keys',
    },
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/keys',
      edit: '/api/runtime_groups/{controlPlaneId}/keys/{id}',
      keySets: '/api/runtime_groups/{controlPlaneId}/key-sets',
      getKeySet: '/api/runtime_groups/{controlPlaneId}/key-sets/{keySetId}',
    },
    kongManager: {
      create: '/{workspace}/keys',
      edit: '/{workspace}/keys/{id}',
      keySets: '/{workspace}/key-sets',
      getKeySet: '/{workspace}/key-sets/{keySetId}',
    },
  },
}
