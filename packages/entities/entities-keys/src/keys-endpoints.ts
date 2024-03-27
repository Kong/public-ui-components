const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/keys`,
      forKeySet: `${konnectBaseApiUrl}/key-sets/{keySetId}/keys`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/keys`,
      forKeySet: `${KMBaseApiUrl}/key-sets/{keySetId}/keys`,
    },
  },
  form: {
    konnect: {
      create: {
        all: `${konnectBaseApiUrl}/keys`,
        forKeySet: `${konnectBaseApiUrl}/key-sets/{keySetId}/keys`,
      },
      edit: {
        all: `${konnectBaseApiUrl}/keys/{id}`,
        forKeySet: `${konnectBaseApiUrl}/key-sets/{keySetId}/keys/{id}`,
      },
      keySets: `${konnectBaseApiUrl}/key-sets`,
      getKeySet: `${konnectBaseApiUrl}/key-sets/{keySetId}`,
    },
    kongManager: {
      create: {
        all: `${KMBaseApiUrl}/keys`,
        forKeySet: `${KMBaseApiUrl}/key-sets/{keySetId}/keys`,
      },
      edit: {
        all: `${KMBaseApiUrl}/keys/{id}`,
        forKeySet: `${KMBaseApiUrl}/key-sets/{keySetId}/keys/{id}`,
      },
      keySets: `${KMBaseApiUrl}/key-sets`,
      getKeySet: `${KMBaseApiUrl}/key-sets/{keySetId}`,
    },
  },
}
