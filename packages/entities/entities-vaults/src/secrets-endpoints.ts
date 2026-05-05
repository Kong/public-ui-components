const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}'

// secrets are only available in Konnect config store
export default {
  getVault: {
    konnect: `${konnectBaseApiUrl}/core-entities/{workspace}/vaults/{id}`,
  },
  list: {
    konnect: `${konnectBaseApiUrl}/{workspace}/config-stores/{id}/secrets`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/{workspace}/config-stores/{id}/secrets`,
      edit: `${konnectBaseApiUrl}/{workspace}/config-stores/{id}/secrets/{secretId}`,
    },
  },
}
