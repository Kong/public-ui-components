export default {
  list: {
    konnect: '/api/runtime_groups/{controlPlaneId}/vaults',
    kongManager: '/{workspace}/vaults',
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/vaults',
      edit: '/api/runtime_groups/{controlPlaneId}/vaults/{id}',
    },
    kongManager: {
      create: '/{workspace}/vaults',
      edit: '/{workspace}/vaults/{id}',
    },
  },
}
