const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/upstreams`,
    kongManager: `${KMBaseApiUrl}/upstreams`,
  },
  form: {
    konnect: {
      getServices: `${konnectBaseApiUrl}/services`,
      getCertificates: `${konnectBaseApiUrl}/certificates`,
      validate: `${konnectBaseApiUrl}/schemas/upstreams/validate`,
      create: `${konnectBaseApiUrl}/upstreams`,
      edit: `${konnectBaseApiUrl}/upstreams/{id}`,
    },
    kongManager: {
      getServices: `${KMBaseApiUrl}/services`,
      getCertificates: `${KMBaseApiUrl}/certificates`,
      validate: `${KMBaseApiUrl}/schemas/upstreams/validate`,
      create: `${KMBaseApiUrl}/upstreams`,
      edit: `${KMBaseApiUrl}/upstreams/{id}`,
    },
  },
}
