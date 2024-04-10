import { describe, it, expect } from 'vitest'
import { PLUGIN_METADATA, getPluginIconURL } from './metadata'

describe('metadata', () => {
  describe('getPluginIconURL', () => {
    const defaultIconURL = 'file:///src/assets/images/plugin-icons/missing.png'

    it('generates default icon URL when icon name provided is empty', () => {
      expect(getPluginIconURL('')).toBe(defaultIconURL)
    })

    it('generates icon URL using PLUGIN_METADATA when icon name provided is a valid key of PLUGIN_METADATA', () => {
      // this is for the case when icon name provided is a key of PLUGIN_METADATA, and also has `imageName` field defined
      const pluginMetadataKey = 'exit-transformer'
      const exitTransformerImageName = PLUGIN_METADATA[pluginMetadataKey].imageName

      expect(getPluginIconURL(pluginMetadataKey)).toContain(`file:///src/assets/images/plugin-icons/${exitTransformerImageName}.png`)
    })

    it('generates icon URL with the provided icon name', () => {
      /**
       * this is for the case when:
       * - icon name provided is a valid key of PLUGIN_METADATA, but the `imageName` field is undefined for it
       * - icon name provided is NOT a valid key of PLUGIN_METADATA
       */
      const iconName = 'acme'

      expect(getPluginIconURL(iconName)).toBe(`file:///src/assets/images/plugin-icons/${iconName}.png`)
    })
  })
})
