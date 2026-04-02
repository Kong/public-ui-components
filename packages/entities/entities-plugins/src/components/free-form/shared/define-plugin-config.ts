import type { PluginFormConfig } from './types'

export function definePluginConfig(config: Partial<PluginFormConfig>): PluginFormConfig {
  return config
}

export type { FieldRenderer, PluginFormConfig } from './types'
