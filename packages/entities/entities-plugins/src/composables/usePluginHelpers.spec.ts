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

  describe('unFlattenObject()', () => {
    it('should return nested object - 2 levels', () => {
      const flattenedData = {
        'item.one': 1,
        'item.two': '2',
        'item.three.something': 'cool',
      }

      expect(helpers.unFlattenObject(flattenedData)).toEqual({
        item: {
          one: 1,
          two: '2',
          three: {
            something: 'cool',
          },
        },
      })
    })

    it('should return nested object - 5 levels', () => {
      const flattenedData = {
        'item.one': 1,
        'item.two': '2',
        'item.three.something': 'cool',
        'item.three.much.deeper.item': 'woah',
      }

      expect(helpers.unFlattenObject(flattenedData)).toEqual({
        item: {
          one: 1,
          two: '2',
          three: {
            something: 'cool',
            much: {
              deeper: {
                item: 'woah',
              },
            },
          },
        },
      })
    })

    it('should return original object - no items to nest', () => {
      const obj = { one: 1, two: '2' }

      expect(helpers.unFlattenObject(obj)).toEqual({
        one: 1,
        two: '2',
      })
    })
  })

  describe('isObjectEmpty()', () => {
    it('should return true if object is empty and false otherwise', () => {
      const obj1 = {}
      const obj2 = { one: 1 }

      expect(helpers.isObjectEmpty(obj1)).toBe(true)
      expect(helpers.isObjectEmpty(obj2)).toBe(false)
    })
  })
})
