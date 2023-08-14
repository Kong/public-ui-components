export default {
  list: {
    konnect: '/api/runtime_groups/{controlPlaneId}/certificates',
    kongManager: '/{workspace}/certificates',
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/certificates',
      edit: '/api/runtime_groups/{controlPlaneId}/certificates/{id}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/certificate/validate',
    },
    kongManager: {
      create: '/{workspace}/certificates',
      edit: '/{workspace}/certificates/{id}',
      validate: '/{workspace}/schemas/certificates/validate',
    },
  },
}
