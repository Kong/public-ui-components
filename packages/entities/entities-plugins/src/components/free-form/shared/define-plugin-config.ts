import type { PluginFormConfig } from './types'

/**
 * Type-checking helper for plugin form configs: a config provides either a custom
 * `component` (which owns its own render rules / field renderers) or top-level
 * `renderRules`/`fieldRenderers` for the default `CommonForm` — never both.
 * Defaulting to `CommonForm` happens in the plugin registry.
 */
export function definePluginConfig(config: PluginFormConfig = {}): PluginFormConfig {
  return config
}

export type { FieldRenderer, PluginFormConfig } from './types'
