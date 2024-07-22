const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/vaults`,
    kongManager: `${KMBaseApiUrl}/vaults`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/vaults`,
      edit: `${konnectBaseApiUrl}/vaults/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/vaults`,
      edit: `${KMBaseApiUrl}/vaults/{id}`,
    },
  },
}
