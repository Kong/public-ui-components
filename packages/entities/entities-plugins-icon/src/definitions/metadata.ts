import type { PluginName } from '@kong-ui-public/entities-plugins-metadata'

/**
 * The filename should same with the plugin name by default.
 * Only plugins with names different from their image filenames should be listed in here.
 */
export const PLUGIN_ASSETS_MAP: Partial<Record<PluginName, string>> = {
  'proxy-cache-advanced': 'proxy-cache',
  'graphql-proxy-cache-advanced': 'graphql',
  'pre-function': 'kong-function',
  'post-function': 'kong-function',
  'konnect-application-auth': 'application-registration',
  'header-cert-auth': 'tls-metadata-headers',
  'upstream-oauth': 'oauth2',
}

/**
 * Gets the URL for the plugin icon.
 *
 * @param name plugin name
 * @returns URL for the plugin icon
 */
export const getPluginIconURL = (name: string) => {
  const imageName = PLUGIN_ASSETS_MAP[name as PluginName] || name || 'missing' // default icon is 'missing'
  const iconURL = new URL(`../assets/${imageName}.png`, import.meta.url).href

  if (iconURL.includes('undefined')) {
    // if URL ends with /undefined or /undefined.png, return default icon
    return new URL('../assets/missing.png', import.meta.url).href
  }
  return iconURL
}
