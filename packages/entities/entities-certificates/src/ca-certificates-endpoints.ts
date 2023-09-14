export default {
  list: {
    konnect: '/api/control_planes/{controlPlaneId}/ca_certificates',
    kongManager: '/{workspace}/ca_certificates',
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/ca_certificates',
      edit: '/api/control_planes/{controlPlaneId}/ca_certificates/{id}',
      validate: '/api/control_planes/{controlPlaneId}/v1/schemas/json/ca-certificate/validate',
    },
    kongManager: {
      create: '/{workspace}/ca_certificates',
      edit: '/{workspace}/ca_certificates/{id}',
      validate: '/{workspace}/schemas/ca_certificates/validate',
    },
  },
}
