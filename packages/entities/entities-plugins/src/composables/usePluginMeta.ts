import { CREDENTIAL_METADATA, PLUGIN_METADATA } from '../definitions/metadata'
import type { PluginMetaData } from '../types'
import useI18n from './useI18n'

export const usePluginMetaData = () => {
  const { i18n: { t } } = useI18n()

  const pluginMetaData: Record<string, PluginMetaData> = {}
  const credentialMetaData: Record<string, any> = {}

  for (const [key, value] of Object.entries(PLUGIN_METADATA)) {
    pluginMetaData[key] = {
      ...value,
      name: t(value.nameKey),
      description: t(value.descriptionKey),
    }
  }

  for (const [key, value] of Object.entries(CREDENTIAL_METADATA)) {
    credentialMetaData[key] = {
      ...value,
      name: t(value.nameKey),
      title: t(value.titleKey),
    }
  }

  const getDisplayName = (name: string) => {
    return pluginMetaData[name]?.name || name
  }

  return { pluginMetaData, credentialMetaData, credentialSchemas: CREDENTIAL_METADATA, getDisplayName }
}
