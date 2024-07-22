const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities'
const KMBaseApiUrl = '/{workspace}'

export default {
  list: {
    konnect: {
      all: `${konnectBaseApiUrl}/routes`,
      forGatewayService: `${konnectBaseApiUrl}/services/{serviceId}/routes`,
    },
    kongManager: {
      all: `${KMBaseApiUrl}/routes`,
      forGatewayService: `${KMBaseApiUrl}/services/{serviceId}/routes`,
    },
  },
  form: {
    konnect: {
      services: `${konnectBaseApiUrl}/services`,
      create: {
        all: `${konnectBaseApiUrl}/routes`,
        forGatewayService: `${konnectBaseApiUrl}/services/{serviceId}/routes`,
      },
      fetch: {
        all: `${konnectBaseApiUrl}/routes/{id}`,
        forGatewayService: `${konnectBaseApiUrl}/services/{serviceId}/routes/{id}`,
      },
      edit: {
        all: `${konnectBaseApiUrl}/routes/{id}`,
        forGatewayService: `${konnectBaseApiUrl}/services/{serviceId}/routes/{id}`,
      },
    },
    kongManager: {
      services: `${KMBaseApiUrl}/services`,
      create: {
        all: `${KMBaseApiUrl}/routes`,
        forGatewayService: `${KMBaseApiUrl}/services/{serviceId}/routes`,
      },
      fetch: {
        all: `${KMBaseApiUrl}/routes/{id}`,
        forGatewayService: `${KMBaseApiUrl}/services/{serviceId}/routes/{id}`,
      },
      edit: {
        all: `${KMBaseApiUrl}/routes/{id}`,
        forGatewayService: `${KMBaseApiUrl}/services/{serviceId}/routes/{id}`,
      },
    },
  },
  item: {
    konnect: {
      getService: `${konnectBaseApiUrl}/services/{serviceId}`,
      all: `${konnectBaseApiUrl}/routes/{id}`,
      forGatewayService: `${konnectBaseApiUrl}/services/{serviceId}/routes/{id}`,
    },
    kongManager: {
      getService: `${KMBaseApiUrl}/services/{serviceId}`,
      all: `${KMBaseApiUrl}/routes/{id}`,
      forGatewayService: `${KMBaseApiUrl}/services/{serviceId}/routes/{id}`,
    },
  },
}
