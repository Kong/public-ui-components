const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const konnectConfigStoreApiUrl = '/v2/control-planes/{controlPlaneId}/{workspace}/config-stores'
const KMBaseApiUrl = '/{workspace}'
// Kong AI Gateway vault API. The {aiGatewayId} placeholder is substituted by the
// vault components (entities-shared only knows {controlPlaneId}/{workspace}/{id}).
const aiGatewayBaseApiUrl = '/v1/ai-gateways/{aiGatewayId}'

export default {
  list: {
    konnect: {
      getAll: `${konnectBaseApiUrl}/vaults`,
      deleteConfigStore: `${konnectConfigStoreApiUrl}/{id}?force=true`,
    },
    kongManager: {
      getAll: `${KMBaseApiUrl}/vaults`,
    },
    aiGateway: {
      getAll: `${aiGatewayBaseApiUrl}/vaults`,
      deleteConfigStore: `${aiGatewayBaseApiUrl}/config-stores/{id}?force=true`,
    },
  },
  form: {
    konnect: {
      create: `${konnectBaseApiUrl}/vaults`,
      createConfigStore: konnectConfigStoreApiUrl,
      edit: `${konnectBaseApiUrl}/vaults/{id}`,
    },
    kongManager: {
      create: `${KMBaseApiUrl}/vaults`,
      edit: `${KMBaseApiUrl}/vaults/{id}`,
    },
    aiGateway: {
      create: `${aiGatewayBaseApiUrl}/vaults`,
      edit: `${aiGatewayBaseApiUrl}/vaults/{id}`,
      createConfigStore: `${aiGatewayBaseApiUrl}/config-stores`,
    },
  },
}
