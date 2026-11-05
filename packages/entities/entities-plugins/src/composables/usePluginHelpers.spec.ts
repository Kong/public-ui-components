import { describe, it, expect } from 'vitest'
import usePluginHelpers from './usePluginHelpers'

describe('usePluginHelpers', () => {
  const helpers = usePluginHelpers()

  describe('convertToDotNotation()', () => {
    it('should convert dasherized notation to dot notation', () => {
      const value = helpers.convertToDotNotation('config-admin-value')

      expect(value).toBe('config.admin.value')
    })
  })
})
