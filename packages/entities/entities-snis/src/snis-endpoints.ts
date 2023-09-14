export default {
  list: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/snis',
    },
    kongManager: {
      all: '/{workspace}/snis',
    },
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/snis',
      edit: '/api/control_planes/{controlPlaneId}/snis/{id}',
      validate: '/api/control_planes/{controlPlaneId}/v1/schemas/json/sni/validate',
      certificates: '/api/control_planes/{controlPlaneId}/certificates',
    },
    kongManager: {
      create: '/{workspace}/snis',
      edit: '/{workspace}/snis/{id}',
      validate: '/{workspace}/schemas/snis/validate',
      certificates: '/{workspace}/certificates',
    },
  },
}
