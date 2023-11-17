export default {
  list: {
    konnect: {
      all: '/v2/control-planes/{controlPlaneId}/core-entities/routes',
      forGatewayService: '/api/control-planes/{controlPlaneId}/core-entities/services/{serviceId}/routes',
    },
    kongManager: {
      all: '/{workspace}/routes',
      forGatewayService: '/{workspace}/services/{serviceId}/routes',
    },
  },
  form: {
    konnect: {
      services: '/api/runtime_groups/{controlPlaneId}/services',
      create: {
        all: '/api/runtime_groups/{controlPlaneId}/routes',
        forGatewayService: '/api/runtime_groups/{controlPlaneId}/services/{serviceId}/routes',
      },
      fetch: {
        all: '/api/runtime_groups/{controlPlaneId}/routes/{id}',
        forGatewayService: '/api/runtime_groups/{controlPlaneId}/services/{serviceId}/routes/{id}',
      },
      edit: {
        all: '/api/runtime_groups/{controlPlaneId}/routes/{id}',
        forGatewayService: '/api/runtime_groups/{controlPlaneId}/services/{serviceId}/routes/{id}',
      },
    },
    kongManager: {
      services: '/{workspace}/services',
      create: {
        all: '/{workspace}/routes',
        forGatewayService: '/{workspace}/services/{serviceId}/routes',
      },
      fetch: {
        all: '/{workspace}/routes/{id}',
        forGatewayService: '/{workspace}/services/{serviceId}/routes/{id}',
      },
      edit: {
        all: '/{workspace}/routes/{id}',
        forGatewayService: '/{workspace}/services/{serviceId}/routes/{id}',
      },
    },
  },
  item: {
    konnect: {
      getService: '/api/runtime_groups/{controlPlaneId}/services/{serviceId}',
      all: '/api/runtime_groups/{controlPlaneId}/routes/{id}',
      forGatewayService: '/api/runtime_groups/{controlPlaneId}/services/{serviceId}/routes/{id}',
    },
    kongManager: {
      getService: '/{workspace}/services/{serviceId}',
      all: '/{workspace}/routes/{id}',
      forGatewayService: '/{workspace}/services/{serviceId}/routes/{id}',
    },
  },
}
