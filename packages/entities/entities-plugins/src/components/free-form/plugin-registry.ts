import CommonForm from './components/CommonForm.vue'

import type { FieldRendererRule, RenderRules } from '@kong-ui-public/freeform'
import type { PluginFormConfig, PluginFormLayoutComponent } from './types'

export interface ResolvedPluginFormConfig {
  component: PluginFormLayoutComponent<any>
  renderRules?: RenderRules
  fieldRenderers: FieldRendererRule[]
}

type PluginConfigModule = PluginFormConfig

const pluginModules = import.meta.glob([
  './plugins/*/index.ts',
  './plugins/*.ts',
  '!./plugins/_shared/**',
], {
  eager: true,
  import: 'default',
}) as Record<string, PluginConfigModule>

export function derivePluginName(path: string): string {
  const match = path.match(/\.\/plugins\/(.+?)(?:\/index)?\.ts$/)

  if (!match) {
    throw new Error(`Unable to derive plugin name from path: ${path}`)
  }

  const [, rawName] = match

  return rawName
}

export function buildPluginConfigRegistry(
  modules: Record<string, PluginConfigModule>,
): Record<string, ResolvedPluginFormConfig> {
  const registry: Record<string, ResolvedPluginFormConfig> = {}
  const seen = new Map<string, string>()

  for (const [path, pluginConfig] of Object.entries(modules)) {
    const pluginName = derivePluginName(path)

    if (seen.has(pluginName)) {
      throw new Error(`Duplicate plugin config for "${pluginName}": ${seen.get(pluginName)} and ${path}`)
    }

    seen.set(pluginName, path)

    registry[pluginName] = {
      component: pluginConfig.component ?? CommonForm,
      renderRules: pluginConfig.renderRules,
      fieldRenderers: pluginConfig.fieldRenderers ?? [],
    }
  }

  return registry
}

export const pluginConfigRegistry = buildPluginConfigRegistry(pluginModules)

export function getPluginConfig(pluginName: string): ResolvedPluginFormConfig | undefined {
  return pluginConfigRegistry[pluginName]
}

export function getFreeFormComponent(
  pluginName: string,
): PluginFormLayoutComponent<any> | undefined {
  return getPluginConfig(pluginName)?.component
}
