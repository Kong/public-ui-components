const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/snis`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/snis`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/snis`,
      edit: `${konnectBaseApiUrl}/snis/{id}`,
      validate: `${konnectBaseApiUrl}/v1/schemas/json/sni/validate`,
      certificates: `${konnectBaseApiUrl}/certificates`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/snis`,
      edit: `${KMBaseApiUrl}/snis/{id}`,
      validate: `${KMBaseApiUrl}/schemas/snis/validate`,
      certificates: `${KMBaseApiUrl}/certificates`,
    },
  },
}
