import type { PluginFormConfig } from './types'

import type { Component } from 'vue'

export interface ResolvedPluginFormConfig extends PluginFormConfig {
  component?: Component
  experimental: boolean
  fieldRenderers: NonNullable<PluginFormConfig['fieldRenderers']>
}

type PluginConfigModule = PluginFormConfig

const pluginModules = import.meta.glob([
  '../plugins/*/index.ts',
  '../plugins/*.ts',
], {
  eager: true,
  import: 'default',
}) as Record<string, PluginConfigModule>

export function derivePluginName(path: string): string {
  const match = path.match(/\.\.\/plugins\/(.+?)(?:\/index)?\.ts$/)

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
      ...pluginConfig,
      component: pluginConfig.component,
      experimental: pluginConfig.experimental ?? false,
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
  experimentalWhitelist: string[],
): Component | undefined {
  const pluginConfig = getPluginConfig(pluginName)

  if (!pluginConfig) {
    return undefined
  }

  if (pluginConfig.experimental && !experimentalWhitelist.includes(pluginName)) {
    return undefined
  }

  return pluginConfig.component
}

export function shouldUseFreeForm(
  pluginName: string,
  experimentalWhitelist: string[],
  engine?: 'vfg' | 'freeform',
): boolean {
  if (engine === 'freeform') {
    return true
  } else if (engine === 'vfg') {
    return false
  }

  return !!getFreeFormComponent(pluginName, experimentalWhitelist)
}

export function getExperimentalPluginNames(): string[] {
  return Object.entries(pluginConfigRegistry)
    .filter(([, config]) => config.experimental)
    .map(([pluginName]) => pluginName)
    .sort((a, b) => a.localeCompare(b))
}
