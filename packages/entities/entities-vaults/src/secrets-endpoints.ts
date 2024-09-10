const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}'

// secrets are only available in Konnect config store
export default {
  getVault: {
    konnect: `${konnectBaseApiUrl}/core-entities/vaults/{id}`,
  },
  list: {
    konnect: `${konnectBaseApiUrl}/config-stores/{id}/secrets`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/config-stores/{id}/secrets`,
      edit: `${konnectBaseApiUrl}/config-stores/{id}/secrets/{secretId}`,
    },
  },
}
