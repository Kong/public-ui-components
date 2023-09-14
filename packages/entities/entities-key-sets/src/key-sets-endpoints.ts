export default {
  list: {
    konnect: '/api/control_planes/{controlPlaneId}/key-sets',
    kongManager: '/{workspace}/key-sets',
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/key-sets',
      edit: '/api/control_planes/{controlPlaneId}/key-sets/{id}',
    },
    kongManager: {
      create: '/{workspace}/key-sets',
      edit: '/{workspace}/key-sets/{id}',
    },
  },
}
