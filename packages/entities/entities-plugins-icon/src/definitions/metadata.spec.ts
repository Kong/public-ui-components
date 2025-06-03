import { describe, it, expect } from 'vitest'
import { PLUGIN_ASSETS_MAP, getPluginIconURL } from './metadata'

describe('metadata', () => {
  describe('getPluginIconURL', () => {
    const defaultIconURL = 'missing.png'

    it('generates default icon URL when icon name provided is not provided or is empty string', () => {
      expect(getPluginIconURL('')).toContain(defaultIconURL)
    })

    it('generates icon URL using PLUGIN_ASSETS_MAP', () => {
      // when icon name provided is a key of PLUGIN_ASSETS_MAP, and also has `imageName` field defined
      const pluginMetadataKey = 'proxy-cache-advanced'
      const pluginImageName = PLUGIN_ASSETS_MAP[pluginMetadataKey]

      expect(getPluginIconURL(pluginMetadataKey)).toContain(`${pluginImageName}.png`)
    })

    it('generates icon URL with the provided icon name', () => {
      /**
       * when:
       * - icon name provided is NOT a valid key of PLUGIN_ASSETS_MAP
       * we directly use the provided icon name to generate a URL (assuming an icon exists, with the same name, in assets directory)
       */
      const iconName = 'acme'

      expect(getPluginIconURL(iconName)).toContain(`${iconName}.png`)
    })

    it('generates icon URL with the provided icon name but no such icon exists', () => {
      /**
       * when icon name is provided, but it's:
       * - neither a key in PLUGIN_ASSETS_MAP
       * - nor a icon of the same name exists in assets directory
       * we then instead use the default icon
       */
      const iconName = 'random-icon-that-doesn`t-exist'

      expect(getPluginIconURL(iconName)).toContain(defaultIconURL)
    })
  })
})
