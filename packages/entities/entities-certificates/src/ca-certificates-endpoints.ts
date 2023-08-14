export default {
  list: {
    konnect: '/api/runtime_groups/{controlPlaneId}/ca_certificates',
    kongManager: '/{workspace}/ca_certificates',
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/ca_certificates',
      edit: '/api/runtime_groups/{controlPlaneId}/ca_certificates/{id}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/ca-certificate/validate',
    },
    kongManager: {
      create: '/{workspace}/ca_certificates',
      edit: '/{workspace}/ca_certificates/{id}',
      validate: '/{workspace}/schemas/ca_certificates/validate',
    },
  },
}
