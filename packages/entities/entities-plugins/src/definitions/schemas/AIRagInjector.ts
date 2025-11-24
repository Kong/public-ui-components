import type { CommonSchemaFields } from '../../types/plugins/shared'

const splitString = (str: string): string[] => {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

export const aiPagInjectorSchema: CommonSchemaFields = {
  // For the ai-rag-injector plugin, 'collection_acl_config' field needs
  // to transform 'allow' and 'deny' comma-separated strings into arrays
  shamefullyTransformPayload: ({ payload }) => {
    if (payload?.config?.collection_acl_config) {
      Object.values(payload.config.collection_acl_config).forEach((aclConfig: any) => {
        if (typeof aclConfig?.allow === 'string') {
          aclConfig.allow = splitString(aclConfig.allow)
        }
        if (typeof aclConfig?.deny === 'string') {
          aclConfig.deny = splitString(aclConfig.deny)
        }
      })
    }
  },
}
