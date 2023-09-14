export default {
  list: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/services',
    },
    kongManager: {
      all: '/{workspace}/services',
    },
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/services',
      validate: '/api/control_planes/{controlPlaneId}/v1/schemas/json/service/validate',
      edit: '/api/control_planes/{controlPlaneId}/services/{id}',
    },
    kongManager: {
      create: '/{workspace}/services',
      validate: '/{workspace}/schemas/services/validate',
      edit: '/{workspace}/services/{id}',
    },
  },
}
