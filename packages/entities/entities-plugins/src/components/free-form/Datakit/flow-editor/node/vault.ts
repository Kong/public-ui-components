import type { Resources } from '../../schema/strict'
import type { DatakitPluginData, FieldName } from '../../types'

export type VaultConfig = Record<FieldName, string>

export function pluginDataToVaultConfig(pluginData: DatakitPluginData): VaultConfig {
  return pluginData.config?.resources?.vault || {}
}

export function pluginDataToVaultOutputFields(pluginData: DatakitPluginData): FieldName[] {
  const { resources } = pluginData.config || {}
  if (resources?.vault) {
    return Object.keys(resources.vault) as FieldName[]
  }
  return []
}

export function vaultConfigToResources(config: VaultConfig): Resources['vault'] {
  const entries = Object.entries(config)
  if (entries.length === 0) return

  const vault: Resources['vault'] = {}

  for (const [name, secretRef] of entries) {
    vault[name] = secretRef
  }

  return vault
}
