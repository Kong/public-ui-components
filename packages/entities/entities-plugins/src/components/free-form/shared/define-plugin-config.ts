import CommonForm from '../Common/CommonForm.vue'
import type { PluginFormConfig } from './types'

export function definePluginConfig(config: Partial<PluginFormConfig> = {}): PluginFormConfig {
  return {
    ...config,
    component: config.component ?? CommonForm,
  }
}

export type { FieldRenderer, PluginFormConfig } from './types'
