const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/key-sets`,
    kongManager: `${KMBaseApiUrl}/key-sets`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/key-sets`,
      edit: `${konnectBaseApiUrl}/key-sets/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/key-sets`,
      edit: `${KMBaseApiUrl}/key-sets/{id}`,
    },
  },
}
