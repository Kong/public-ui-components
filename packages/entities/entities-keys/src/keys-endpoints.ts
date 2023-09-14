export default {
  list: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/keys',
      forKeySet: '/api/control_planes/{controlPlaneId}/key-sets/{keySetId}/keys',
    },
    kongManager: {
      all: '/{workspace}/keys',
      forKeySet: '/{workspace}/key-sets/{keySetId}/keys',
    },
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/keys',
      edit: '/api/control_planes/{controlPlaneId}/keys/{id}',
      keySets: '/api/control_planes/{controlPlaneId}/key-sets',
      getKeySet: '/api/control_planes/{controlPlaneId}/key-sets/{keySetId}',
    },
    kongManager: {
      create: '/{workspace}/keys',
      edit: '/{workspace}/keys/{id}',
      keySets: '/{workspace}/key-sets',
      getKeySet: '/{workspace}/key-sets/{keySetId}',
    },
  },
}
