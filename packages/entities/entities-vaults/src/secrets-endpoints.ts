const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'

// secrets are only available in Konnect config store
export default {
  list: {
    konnect: `${konnectBaseApiUrl}/vaults/{id}/secrets`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/vaults/{id}/secrets`,
      edit: `${konnectBaseApiUrl}/vaults/{id}/secrets/{secretId}`,
    },
  },
}
