import type { PluginFormConfig } from './types'

export function definePluginConfig<T extends PluginFormConfig>(config: T): T {
  return config
}

export type { FieldRenderer, PluginFormConfig } from './types'
