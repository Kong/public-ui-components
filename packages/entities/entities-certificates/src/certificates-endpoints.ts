export default {
  list: {
    konnect: '/api/control_planes/{controlPlaneId}/certificates',
    kongManager: '/{workspace}/certificates',
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/certificates',
      edit: '/api/control_planes/{controlPlaneId}/certificates/{id}',
      validate: '/api/control_planes/{controlPlaneId}/v1/schemas/json/certificate/validate',
    },
    kongManager: {
      create: '/{workspace}/certificates',
      edit: '/{workspace}/certificates/{id}',
      validate: '/{workspace}/schemas/certificates/validate',
    },
  },
}
