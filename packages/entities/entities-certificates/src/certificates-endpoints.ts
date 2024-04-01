const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/certificates`,
    kongManager: `${KMBaseApiUrl}/certificates`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/certificates`,
      edit: `${konnectBaseApiUrl}/certificates/{id}`,
      validate: `${konnectBaseApiUrl}/v1/schemas/json/certificate/validate`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/certificates`,
      edit: `${KMBaseApiUrl}/certificates/{id}`,
      validate: `${KMBaseApiUrl}/schemas/certificates/validate`,
    },
  },
}
