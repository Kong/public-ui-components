const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/partials`,
    kongManager: `${KMBaseApiUrl}/partials`,
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
  links: {
    konnect: `${konnectBaseApiUrl}/partials/{id}/links`,
    kongManager: `${KMBaseApiUrl}/partials/{id}/links`,
  },
  detail: {
    konnect: `${konnectBaseApiUrl}/partials/{id}`,
    kongManager: `${KMBaseApiUrl}/partials/{id}`,
  },
}
