const konnectBaseApiUrl = '/v2/control-planes/{controlPlaneId}/core-entities/{workspace}'
const konnectConfigStoreApiUrl = '/v2/control-planes/{controlPlaneId}/{workspace}/config-stores'
// Kong AI Gateway. The {aiGatewayId} placeholder is substituted by the secret components.
const aiGatewayBaseApiUrl = '/v1/ai-gateways/{aiGatewayId}'

// Secrets live under a Config Store. For Konnect this is the core-entities vault +
// config-store API. For AI Gateway the vault is fetched from the AI Gateway path, but
// the AI Gateway secret CRUD API is not shipped yet — these paths mirror the Config
// Store APIs (the shape the backend says it will follow) and MUST be confirmed/updated
// once the real endpoints land. Keeping them here makes that swap a one-file change.
export default {
  getVault: {
    konnect: `${konnectBaseApiUrl}/vaults/{id}`,
    aiGateway: `${aiGatewayBaseApiUrl}/vaults/{id}`,
  },
  list: {
    konnect: `${konnectConfigStoreApiUrl}/{id}/secrets`,
    aiGateway: `${aiGatewayBaseApiUrl}/config-stores/{id}/secrets`,
  },
  form: {
    konnect: {
      create: `${konnectConfigStoreApiUrl}/{id}/secrets`,
      edit: `${konnectConfigStoreApiUrl}/{id}/secrets/{secretId}`,
    },
    aiGateway: {
      create: `${aiGatewayBaseApiUrl}/config-stores/{id}/secrets`,
      edit: `${aiGatewayBaseApiUrl}/config-stores/{id}/secrets/{secretId}`,
    },
  },
}
