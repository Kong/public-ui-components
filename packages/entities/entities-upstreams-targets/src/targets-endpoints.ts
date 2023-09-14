export default {
  list: {
    konnect: '/api/control_planes/{controlPlaneId}/upstreams/{upstreamId}/targets',
    kongManager: '/{workspace}/upstreams/{upstreamId}/targets',
  },
  form: {
    konnect: {
      create: '/api/control_planes/{controlPlaneId}/upstreams/{upstreamId}/targets',
      edit: '/api/control_planes/{controlPlaneId}/upstreams/{upstreamId}/targets/{id}',
      validate: '/api/control_planes/{controlPlaneId}/v1/schemas/json/target/validate',
    },
    kongManager: {
      create: '/{workspace}/upstreams/{upstreamId}/targets',
      edit: '/{workspace}/upstreams/{upstreamId}/targets/{id}',
      validate: '/{workspace}/schemas/targets/validate',
    },
  },
}
