export default {
  list: {
    konnect: '/api/runtime_groups/{controlPlaneId}/upstreams/{upstreamId}/targets',
    kongManager: '/{workspace}/upstreams/{upstreamId}/targets',
  },
  form: {
    konnect: {
      create: '/api/runtime_groups/{controlPlaneId}/upstreams/{upstreamId}/targets',
      edit: '/api/runtime_groups/{controlPlaneId}/upstreams/{upstreamId}/targets/{id}',
      validate: '/api/runtime_groups/{controlPlaneId}/v1/schemas/json/target/validate',
    },
    kongManager: {
      create: '/{workspace}/upstreams/{upstreamId}/targets',
      edit: '/{workspace}/upstreams/{upstreamId}/targets/{id}',
      validate: '/{workspace}/schemas/targets/validate',
    },
  },
}
