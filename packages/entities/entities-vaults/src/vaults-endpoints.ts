const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const konnectConfigStoreApiUrl = '/v2/control-planes/{controlPlaneId}/config-stores'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      getAll: `${konnectBaseApiUrl}/vaults`,
      deleteConfigStore: `${konnectConfigStoreApiUrl}/{id}`,
    },
    kongManager: {
      getAll: `${KMBaseApiUrl}/vaults`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/vaults`,
      createConfigStore: konnectConfigStoreApiUrl,
      edit: `${konnectBaseApiUrl}/vaults/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/vaults`,
      edit: `${KMBaseApiUrl}/vaults/{id}`,
    },
  },
}
