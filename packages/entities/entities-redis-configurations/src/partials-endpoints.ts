const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  // list: {
  //   konnect: {
  //     getAll: `${konnectBaseApiUrl}/vaults`,
  //     deleteConfigStore: `${konnectConfigStoreApiUrl}/{id}?force=true`,
  //   },
  //   kongManager: {
  //     getAll: `${KMBaseApiUrl}/vaults`,
  //   },
  // },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/partials`,
      edit: `${konnectBaseApiUrl}/partials/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/partials`,
      edit: `${KMBaseApiUrl}/partials/{id}`,
    },
  },
}
