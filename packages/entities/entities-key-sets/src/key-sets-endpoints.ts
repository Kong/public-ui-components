export default {
  list: {
    konnect: '/api/runtime_groups/{controlPlaneId}/key-sets',
    kongManager: '/{workspace}/key-sets',
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/key-sets',
      edit: '/api/runtime_groups/{controlPlaneId}/key-sets/{id}',
    },
    kongManager: {
      create: '/{workspace}/key-sets',
      edit: '/{workspace}/key-sets/{id}',
    },
  },
}
