const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/partials`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/partials`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/partials`,
      edit: `${konnectBaseApiUrl}/partials/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/partials`,
      edit: `${KMBaseApiUrl}/partials/{id}`,
    },
  },
}
