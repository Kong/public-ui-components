const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/services`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/services`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/services`,
      validate: `${konnectBaseApiUrl}/v1/schemas/json/service/validate`,
      edit: `${konnectBaseApiUrl}/services/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/services`,
      validate: `${KMBaseApiUrl}/schemas/services/validate`,
      edit: `${KMBaseApiUrl}/services/{id}`,
    },
  },
}
