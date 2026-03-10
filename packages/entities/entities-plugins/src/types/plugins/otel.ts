import type { CommonSchemaFields } from '../../types/plugins/shared'

/**
 * The config interface of OTEL above v3.14
 */
export interface OTELPluginConfig_gte_314 {
  config: {
    access_logs: {
      custom_attributes_by_lua?: Record<string, string> | null
      endpoint?: string | null
    }
  }
}

export interface OTELSchema extends CommonSchemaFields<OTELPluginConfig_gte_314> {}
