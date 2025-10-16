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
      certificates: `${konnectBaseApiUrl}/certificates`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/snis`,
      edit: `${KMBaseApiUrl}/snis/{id}`,
      certificates: `${KMBaseApiUrl}/certificates`,
    },
  },
}
