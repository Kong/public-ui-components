export default {
  list: {
    konnect: {
      all: '/api/control_planes/{controlPlaneId}/routes',
      forGatewayService: '/api/control_planes/{controlPlaneId}/services/{serviceId}/routes',
    },
    kongManager: {
      all: '/{workspace}/routes',
      forGatewayService: '/{workspace}/services/{serviceId}/routes',
    },
  },
  form: {
    konnect: {
      services: '/api/control_planes/{controlPlaneId}/services',
      create: {
        all: '/api/control_planes/{controlPlaneId}/routes',
        forGatewayService: '/api/control_planes/{controlPlaneId}/services/{serviceId}/routes',
      },
      fetch: {
        all: '/api/control_planes/{controlPlaneId}/routes/{id}',
        forGatewayService: '/api/control_planes/{controlPlaneId}/services/{serviceId}/routes/{id}',
      },
      edit: {
        all: '/api/control_planes/{controlPlaneId}/routes/{id}',
        forGatewayService: '/api/control_planes/{controlPlaneId}/services/{serviceId}/routes/{id}',
      },
    },
    kongManager: {
      services: '/{workspace}/services/',
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
      getService: '/api/control_planes/{controlPlaneId}/services/{serviceId}',
      all: '/api/control_planes/{controlPlaneId}/routes/{id}',
      forGatewayService: '/api/control_planes/{controlPlaneId}/services/{serviceId}/routes/{id}',
    },
    kongManager: {
      getService: '/{workspace}/services/{serviceId}',
      all: '/{workspace}/routes/{id}',
      forGatewayService: '/{workspace}/services/{serviceId}/routes/{id}',
    },
  },
}
