import { describe, it, expect, vi } from 'vitest'
import { deepMergeConfig, normalizeMatch, sortFieldsByBundles, stripDefaults } from './utils'
import type { NamedFieldSchema } from '../../../types/plugins/form-schema'

describe('sortFieldsByBundles', () => {
  // Helper to create test fields
  const createFields = (...names: string[]): NamedFieldSchema[] => {
    return names.map(name => ({ [name]: { type: 'string' as const } }))
  }

  describe('basic functionality', () => {
    it('should return fields unchanged when no bundles provided', () => {
      const fields = createFields('A', 'B', 'C', 'D')
      const result = sortFieldsByBundles(fields, [])

      expect(result).toEqual(fields)
    })

    it('should handle empty fields array', () => {
      const result = sortFieldsByBundles([], [['A', 'B']])

      expect(result).toEqual([])
    })
  })

  describe('simple bundle examples from documentation', () => {
    it('should group C and B together - Example 1', () => {
      // fields = [A, B, C, D], bundles = [[C, B]]
      // Result: [A, C, B, D] - A first, then C,B bundle, then D
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['C', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'C', 'B', 'D'])
    })

    it('should group B and A at first occurrence - Example 2', () => {
      // fields = [A, B, C, D], bundles = [[B, A]]
      // Result: [B, A, C, D]
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['B', 'A']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['B', 'A', 'C', 'D'])
    })

    it('should handle multiple bundles - Example 3', () => {
      // fields = [A, B, C, D], bundles = [[D, A], [C, B]]
      // A skipped (needs D), B skipped (needs C), C added with B, D added with A
      // Result: [C, B, D, A]
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['D', 'A'], ['C', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['C', 'B', 'D', 'A'])
    })

    it('should handle transitive dependencies - Example 4', () => {
      // fields = [A, B, C, D], bundles = [[C, B], [B, A]]
      // A skipped (needs B), B skipped (needs C), C triggers B then A, D last
      // Result: [C, B, A, D]
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['C', 'B'], ['B', 'A']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['C', 'B', 'A', 'D'])
    })
  })

  describe('bundle dependency handling', () => {
    it('should handle single field bundle', () => {
      const fields = createFields('A', 'B', 'C')
      const bundles = [['B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'B', 'C'])
    })

    it('should handle bundle with three fields', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E')
      const bundles = [['C', 'B', 'E']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'C', 'B', 'E', 'D'])
    })

    it('should satisfy dependencies before adding dependent fields', () => {
      const fields = createFields('A', 'B', 'C')
      const bundles = [['B', 'A']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      // B comes first in bundle, so when we hit A or B, we add B then A
      expect(resultNames).toEqual(['B', 'A', 'C'])
    })
  })

  describe('complex transitive dependencies', () => {
    it('should handle chain of three bundles', () => {
      // E -> D -> C (each depends on previous)
      const fields = createFields('A', 'B', 'C', 'D', 'E')
      const bundles = [['E', 'D'], ['D', 'C'], ['C', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'E', 'D', 'C', 'B'])
    })

    it('should handle deep transitive dependencies', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E', 'F')
      const bundles = [['F', 'E'], ['E', 'D'], ['D', 'C'], ['C', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'F', 'E', 'D', 'C', 'B'])
    })
  })

  describe('edge cases and special scenarios', () => {
    it('should handle bundle with field not in fields list', () => {
      const fields = createFields('A', 'B', 'C')
      const bundles = [['X', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      // B depends on X which doesn't exist, so B stays in original position
      expect(resultNames).toEqual(['A', 'B', 'C'])
    })

    it('should handle all fields in one bundle', () => {
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['A', 'B', 'C', 'D']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'B', 'C', 'D'])
    })

    it('should handle reverse order bundle', () => {
      const fields = createFields('A', 'B', 'C', 'D')
      const bundles = [['D', 'C', 'B', 'A']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['D', 'C', 'B', 'A'])
    })

    it('should handle non-bundled fields interspersed', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E', 'F')
      const bundles = [['B', 'D'], ['E', 'F']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      // A (not bundled), B+D (bundle), C (not bundled), E+F (bundle)
      expect(resultNames).toEqual(['A', 'B', 'D', 'C', 'E', 'F'])
    })
  })

  describe('preserving original field schema', () => {
    it('should preserve field schema structure', () => {
      const fields: NamedFieldSchema[] = [
        { A: { type: 'string', default: 'test' } },
        { B: { type: 'number', required: true } },
        { C: { type: 'boolean' } },
      ]
      const bundles = [['C', 'B']]
      const result = sortFieldsByBundles(fields, bundles)

      expect(result[0]).toEqual({ A: { type: 'string', default: 'test' } })
      expect(result[1]).toEqual({ C: { type: 'boolean' } })
      expect(result[2]).toEqual({ B: { type: 'number', required: true } })
    })

    it('should not mutate original fields array', () => {
      const fields = createFields('A', 'B', 'C', 'D')
      const originalFields = [...fields]
      const bundles = [['D', 'C']]

      sortFieldsByBundles(fields, bundles)

      expect(fields).toEqual(originalFields)
    })
  })

  describe('cascade triggering', () => {
    it('should trigger cascades when dependencies are unlocked', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E')
      const bundles = [['B', 'A'], ['C', 'B'], ['D', 'C']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      // D depends on C, C depends on B, B has no deps
      // When we hit B, it triggers C, which triggers D
      expect(resultNames).toEqual(['D', 'C', 'B', 'A', 'E'])
    })

    it('should handle multiple cascade triggers', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E', 'F', 'G')
      const bundles = [['E', 'D'], ['D', 'C'], ['G', 'F']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      // A, B (not bundled), E triggers D which triggers C, F skipped, G adds F
      expect(resultNames).toEqual(['A', 'B', 'E', 'D', 'C', 'G', 'F'])
    })
  })

  describe('order preservation', () => {
    it('should maintain original order when no dependencies', () => {
      const fields = createFields('Z', 'Y', 'X', 'W')
      const bundles: string[][] = []
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['Z', 'Y', 'X', 'W'])
    })

    it('should preserve order of independent bundles', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E', 'F')
      const bundles = [['A', 'B'], ['E', 'F']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    })
  })

  describe('real-world scenarios', () => {
    it('should handle plugin config field dependencies', () => {
      const fields = createFields(
        'name',
        'enabled',
        'config-host',
        'config-port',
        'config-timeout',
        'tags',
      )
      const bundles = [['config-host', 'config-port']]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual([
        'name',
        'enabled',
        'config-host',
        'config-port',
        'config-timeout',
        'tags',
      ])
    })

    it('should handle complex plugin form with multiple dependency chains', () => {
      const fields = createFields(
        'id',
        'name',
        'service',
        'route',
        'consumer',
        'config-key',
        'config-secret',
        'config-url',
        'enabled',
      )
      const bundles = [
        ['config-url', 'config-key'],
        ['config-key', 'config-secret'],
      ]
      const result = sortFieldsByBundles(fields, bundles)

      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual([
        'id',
        'name',
        'service',
        'route',
        'consumer',
        'config-url',
        'config-key',
        'config-secret',
        'enabled',
      ])
    })
  })

  describe('performance and stability', () => {
    it('should handle large number of fields efficiently', () => {
      const fieldNames = Array.from({ length: 100 }, (_, i) => `field${i}`)
      const fields = createFields(...fieldNames)
      const bundles = [
        ['field50', 'field51'],
        ['field75', 'field76', 'field77'],
      ]

      const result = sortFieldsByBundles(fields, bundles)

      expect(result).toHaveLength(100)
      expect(result.map(f => Object.keys(f)[0])).toContain('field0')
      expect(result.map(f => Object.keys(f)[0])).toContain('field99')
    })

    it('should handle many bundles', () => {
      const fields = createFields('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')
      const bundles = [
        ['A', 'B'],
        ['C', 'D'],
        ['E', 'F'],
        ['G', 'H'],
      ]

      const result = sortFieldsByBundles(fields, bundles)

      expect(result).toHaveLength(8)
      const resultNames = result.map(f => Object.keys(f)[0])
      expect(resultNames).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    })

    it('should not create infinite loops with circular references', () => {
      // Note: Current algorithm doesn't support circular deps,
      // but should not hang
      const fields = createFields('A', 'B', 'C')
      const bundles = [['A', 'B'], ['B', 'A']]

      expect(() => {
        sortFieldsByBundles(fields, bundles)
      }).not.toThrow()
    })

    it('should handle bundle with long array of fields', () => {
      const fields = createFields(
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      )
      const bundles = [
        ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'],
      ]

      const result = sortFieldsByBundles(fields, bundles)

      expect(result).toHaveLength(18)
      const resultNames = result.map(f => Object.keys(f)[0])
      // A-D stay in order, then E-N bundle, then O-R stay in order
      expect(resultNames).toEqual([
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      ])
    })
  })
})

describe('normalizeMatch', () => {
  it('converts string matches into exact path predicates', () => {
    const match = normalizeMatch('config.redis')

    expect(match({
      path: 'config.redis',
      genericPath: 'config.redis',
      schema: { type: 'string' },
    })).toBe(true)

    expect(match({
      path: 'config.redis.host',
      genericPath: 'config.redis.host',
      schema: { type: 'string' },
    })).toBe(false)
  })

  it('passes function matches through unchanged', () => {
    const predicate = vi.fn(() => true)
    const match = normalizeMatch(predicate)

    expect(match).toBe(predicate)
  })
})

describe('stripDefaults', () => {
  it('removes fields matching defaults', () => {
    const data = { a: 1, b: 2, c: 3 }
    const defaults = { a: 1, b: 99, c: 3 }

    expect(stripDefaults(data, defaults)).toEqual({ b: 2 })
  })

  it('handles nested records recursively', () => {
    const data = { config: { host: 'custom', port: 8080 } }
    const defaults = { config: { host: 'localhost', port: 8080 } }

    expect(stripDefaults(data, defaults)).toEqual({ config: { host: 'custom' } })
  })

  it('omits nested records when all children match defaults', () => {
    const data = { config: { host: 'localhost', port: 8080 } }
    const defaults = { config: { host: 'localhost', port: 8080 } }

    expect(stripDefaults(data, defaults)).toEqual({})
  })

  it('keeps arrays that differ from defaults', () => {
    const data = { protocols: ['https', 'http'] }
    const defaults = { protocols: ['http', 'https'] }

    expect(stripDefaults(data, defaults)).toEqual({ protocols: ['https', 'http'] })
  })

  it('removes arrays that match defaults exactly', () => {
    const data = { protocols: ['http', 'https'] }
    const defaults = { protocols: ['http', 'https'] }

    expect(stripDefaults(data, defaults)).toEqual({})
  })

  it('removes null fields when the default is null', () => {
    const data = { a: null, b: 'value' }
    const defaults = { a: null, b: null }

    expect(stripDefaults(data, defaults)).toEqual({ b: 'value' })
  })

  it('keeps fields that are not present in defaults', () => {
    const data = { config: { custom_key: 'value' } }
    const defaults = { config: {} }

    expect(stripDefaults(data, defaults)).toEqual({ config: { custom_key: 'value' } })
  })

  it('handles empty data', () => {
    expect(stripDefaults({}, { a: 1 })).toEqual({})
  })

  it('handles empty defaults', () => {
    const data = { a: 1 }

    expect(stripDefaults(data, {})).toEqual({ a: 1 })
  })

  it('handles deeply nested structures', () => {
    const data = { config: { redis: { host: 'custom', port: 6379, db: 0 } } }
    const defaults = { config: { redis: { host: 'localhost', port: 6379, db: 0 } } }

    expect(stripDefaults(data, defaults)).toEqual({ config: { redis: { host: 'custom' } } })
  })
})

describe('deepMergeConfig', () => {
  it('recursively merges nested objects', () => {
    const base = { config: { host: 'x', timeout: 60000, retries: 5 } }
    const override = { config: { host: 'y' } }

    expect(deepMergeConfig(base, override)).toEqual({
      config: { host: 'y', timeout: 60000, retries: 5 },
    })
  })

  it('replaces arrays entirely', () => {
    const base = { protocols: ['http', 'https'] }
    const override = { protocols: ['grpc'] }

    expect(deepMergeConfig(base, override)).toEqual({ protocols: ['grpc'] })
  })

  it('preserves base keys that are not overridden', () => {
    const base = { a: 1, b: 2 }
    const override = { a: 10 }

    expect(deepMergeConfig(base, override)).toEqual({ a: 10, b: 2 })
  })

  it('supports null overrides', () => {
    const base = { a: 1, b: 2 }
    const override = { a: null }

    expect(deepMergeConfig(base, override)).toEqual({ a: null, b: 2 })
  })

  it('handles deeply nested merges', () => {
    const base = { config: { redis: { host: 'old', port: 6379, db: 0 } } }
    const override = { config: { redis: { host: 'new' } } }

    expect(deepMergeConfig(base, override)).toEqual({
      config: { redis: { host: 'new', port: 6379, db: 0 } },
    })
  })

  it('adds new keys from the override', () => {
    const base = { config: { host: 'x' } }
    const override = { config: { host: 'x', custom: 'new' } }

    expect(deepMergeConfig(base, override)).toEqual({
      config: { host: 'x', custom: 'new' },
    })
  })
})
