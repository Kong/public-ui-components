export default {
  list: {
    konnect: {
      all: '/v2/control-planes/{controlPlaneId}/core-entities/services',
    },
    kongManager: {
      all: '/{workspace}/services',
    },
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/services',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/service/validate',
      edit: '/api/runtime_groups/{controlPlaneId}/services/{id}',
    },
    kongManager: {
      create: '/{workspace}/services',
      validate: '/{workspace}/schemas/services/validate',
      edit: '/{workspace}/services/{id}',
    },
  },
}
