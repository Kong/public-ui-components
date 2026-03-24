const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const konnectConfigStoreApiUrl = '/v2/control-planes/{controlPlaneId}/{workspace}/config-stores'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      getAll: `${konnectBaseApiUrl}/vaults`,
      deleteConfigStore: `${konnectConfigStoreApiUrl}/{id}?force=true`,
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
