import type { CommonSchemaFields } from '../../types/plugins/shared'

export const aiPagInjectorSchema: CommonSchemaFields = {
  // For the ai-rag-injector plugin, 'collection_acl_config' field needs
  // to transform 'allow' and 'deny' comma-separated strings into arrays
  shamefullyTransformPayload: ({ payload }) => {
    if (payload?.config?.collection_acl_config) {
      Object.values(payload.config.collection_acl_config).forEach((aclConfig: any) => {
        if (aclConfig?.allow) {
          aclConfig.allow = aclConfig.allow.split(',').map((s: string) => s.trim())
        }
        if (aclConfig?.deny) {
          aclConfig.deny = aclConfig.deny.split(',').map((s: string) => s.trim())
        }
      })
    }
  },
}
