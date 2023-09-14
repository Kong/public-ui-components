export default {
  list: {
    konnect: '/api/control_planes/{controlPlaneId}/vaults',
    kongManager: '/{workspace}/vaults',
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/vaults',
      edit: '/api/control_planes/{controlPlaneId}/vaults/{id}',
    },
    kongManager: {
      create: '/{workspace}/vaults',
      edit: '/{workspace}/vaults/{id}',
    },
  },
}
