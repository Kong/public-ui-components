export default {
  list: {
    konnect: {
      all: '/api/runtime_groups/{controlPlaneId}/snis',
    },
    kongManager: {
      all: '/{workspace}/snis',
    },
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/snis',
      edit: '/api/runtime_groups/{controlPlaneId}/snis/{id}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/sni/validate',
      certificates: '/api/runtime_groups/{controlPlaneId}/certificates',
    },
    kongManager: {
      create: '/{workspace}/snis',
      edit: '/{workspace}/snis/{id}',
      validate: '/{workspace}/schemas/snis/validate',
      certificates: '/{workspace}/certificates',
    },
  },
}
