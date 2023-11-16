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
      create: {
        all: '/api/runtime_groups/{controlPlaneId}/keys',
        forKeySet: '/api/runtime_groups/{controlPlaneId}/key-sets/{keySetId}/keys',
      },
      edit: {
        all: '/api/runtime_groups/{controlPlaneId}/keys/{id}',
        forKeySet: '/api/runtime_groups/{controlPlaneId}/key-sets/{keySetId}/keys/{id}',
      },
      keySets: '/api/runtime_groups/{controlPlaneId}/key-sets',
      getKeySet: '/api/runtime_groups/{controlPlaneId}/key-sets/{keySetId}',
    },
    kongManager: {
      create: {
        all: '/{workspace}/keys',
        forKeySet: '/{workspace}/key-sets/{keySetId}/keys',
      },
      edit: {
        all: '/{workspace}/keys/{id}',
        forKeySet: '/{workspace}/key-sets/{keySetId}/keys/{id}',
      },
      keySets: '/{workspace}/key-sets',
      getKeySet: '/{workspace}/key-sets/{keySetId}',
    },
  },
}
