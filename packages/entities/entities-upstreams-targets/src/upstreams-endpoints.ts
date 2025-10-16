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
      create: `${konnectBaseApiUrl}/upstreams`,
      edit: `${konnectBaseApiUrl}/upstreams/{id}`,
    },
    kongManager: {
      getServices: `${KMBaseApiUrl}/services`,
      getCertificates: `${KMBaseApiUrl}/certificates`,
      create: `${KMBaseApiUrl}/upstreams`,
      edit: `${KMBaseApiUrl}/upstreams/{id}`,
    },
  },
}
