const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const konnectConfigStoreApiUrl = '/v2/control-planes/{controlPlaneId}/{workspace}/config-stores'

// secrets are only available in Konnect config store
export default {
  getVault: {
    konnect: `${konnectBaseApiUrl}/vaults/{id}`,
  },
  list: {
    konnect: `${konnectConfigStoreApiUrl}/{id}/secrets`,
  },
  form: {
    konnect: {
      create: `${konnectConfigStoreApiUrl}/{id}/secrets`,
      edit: `${konnectConfigStoreApiUrl}/{id}/secrets/{secretId}`,
    },
  },
}
