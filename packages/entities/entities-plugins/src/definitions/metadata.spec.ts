import { describe, it, expect } from 'vitest'
import { PLUGIN_METADATA, getPluginIconURL } from './metadata'

describe('metadata', () => {
  describe('getPluginIconURL', () => {
    const defaultIconURL = 'missing.png'

    it('generates default icon URL when icon name provided is not provided or is empty string', () => {
      expect(getPluginIconURL('')).toContain(defaultIconURL)
    })

    it('generates icon URL using PLUGIN_METADATA', () => {
      // when icon name provided is a key of PLUGIN_METADATA, and also has `imageName` field defined
      const pluginMetadataKey = 'exit-transformer'
      const exitTransformerImageName = PLUGIN_METADATA[pluginMetadataKey].imageName

      expect(getPluginIconURL(pluginMetadataKey)).toContain(`${exitTransformerImageName}.png`)
    })

    it('generates icon URL with the provided icon name', () => {
      /**
       * when:
       * - icon name provided is a valid key of PLUGIN_METADATA, but the `imageName` field is undefined for it
       * OR
       * - icon name provided is NOT a valid key of PLUGIN_METADATA
       * we directly use the provided icon name to generate a URL (assuming an icon exists, with the same name, in assets directory)
       */
      const iconName = 'acme'

      expect(getPluginIconURL(iconName)).toContain(`${iconName}.png`)
    })

    it('generates icon URL with the provided icon name but no such icon exists', () => {
      /**
       * when icon name is provided, but it's:
       * - neither a key in PLUGIN_METADATA
       * - nor a icon of the same name exists in assets directory
       * we then instead use the default icon
       */
      const iconName = 'random-icon-that-doesn`t-exist'

      expect(getPluginIconURL(iconName)).toContain(defaultIconURL)
    })
  })
})
