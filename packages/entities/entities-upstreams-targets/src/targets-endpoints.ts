const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: `${konnectBaseApiUrl}/upstreams/{upstreamId}/targets`,
    kongManager: `${KMBaseApiUrl}/upstreams/{upstreamId}/targets`,
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/upstreams/{upstreamId}/targets`,
      edit: `${konnectBaseApiUrl}/upstreams/{upstreamId}/targets/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/upstreams/{upstreamId}/targets`,
      edit: `${KMBaseApiUrl}/upstreams/{upstreamId}/targets/{id}`,
    },
  },
}
