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
      edit: `${konnectBaseApiUrl}/services/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/services`,
      edit: `${KMBaseApiUrl}/services/{id}`,
    },
  },
}
