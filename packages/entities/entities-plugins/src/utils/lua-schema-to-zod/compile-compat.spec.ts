import { describe, expect, it } from 'vitest'
import { compileSchemaCompat } from './compile-compat'

// `compat` mode answers a different question than `strict`: not "is this
// config fully valid" but "would rendering this value in the visual form
// break or show something nonsensically blank". See the README.
describe('compileSchemaCompat', () => {
  it('accepts a missing/null value on a required field', () => {
    const zodSchema = compileSchemaCompat({
      fields: [{ name: { type: 'string', required: true } }],
    })

    expect(zodSchema.safeParse({}).success).toBe(true)
    expect(zodSchema.safeParse({ name: null }).success).toBe(true)
  })

  it('still rejects a value outside `one_of` (would render an empty <select>)', () => {
    const zodSchema = compileSchemaCompat({
      fields: [{ policy: { type: 'string', one_of: ['local', 'redis'] } }],
    })

    expect(zodSchema.safeParse({ policy: 'not-an-option' }).success).toBe(false)
    expect(zodSchema.safeParse({ policy: 'redis' }).success).toBe(true)
  })

  it('still rejects the wrong JS type for a field (would break the matching Field component)', () => {
    const zodSchema = compileSchemaCompat({
      fields: [{ redis: { type: 'record', fields: [{ host: { type: 'string' } }] } }],
    })

    expect(zodSchema.safeParse({ redis: 'not-an-object' }).success).toBe(false)
    expect(zodSchema.safeParse({ redis: { host: 'ok' } }).success).toBe(true)
  })

  it('relaxes content-level checks: length, pattern, range, integer-ness, not_one_of', () => {
    const zodSchema = compileSchemaCompat({
      fields: [
        { name: { type: 'string', len_min: 5, match: '^[a-z]+$' } },
        { port: { type: 'integer', between: [0, 100] } },
        { excluded: { type: 'string', not_one_of: ['banned'] } },
      ],
    })

    const result = zodSchema.safeParse({ name: 'AB', port: 999.5, excluded: 'banned' })
    expect(result.success).toBe(true)
  })

  it('still rejects a `foreign`/`referenceable` value that matches none of the allowed shapes', () => {
    const zodSchema = compileSchemaCompat({
      fields: [{ consumer: { type: 'foreign', reference: 'consumers' } }],
    })

    expect(zodSchema.safeParse({ consumer: 42 }).success).toBe(false)
    expect(zodSchema.safeParse({ consumer: null }).success).toBe(true)
    expect(zodSchema.safeParse({ consumer: 'some-id' }).success).toBe(true)
  })

  it('applies compat rules recursively to array items and map values', () => {
    const zodSchema = compileSchemaCompat({
      fields: [
        {
          tags: {
            type: 'array',
            elements: { type: 'string', len_min: 10 },
          },
        },
        {
          headers: {
            type: 'map',
            values: { type: 'string', one_of: ['a', 'b'] },
          },
        },
      ],
    })

    // array item content check (len_min) relaxed
    expect(zodSchema.safeParse({ tags: ['x'] }).success).toBe(true)
    // map value one_of still enforced
    expect(zodSchema.safeParse({ headers: { x: 'not-allowed' } }).success).toBe(false)
    expect(zodSchema.safeParse({ headers: { x: 'a' } }).success).toBe(true)
  })

  it('does not throw on an unrecognized field type, falls back to unknown()', () => {
    const weirdSchema = { fields: [{ mystery: { type: 'brand-new-type' as any } }] }
    const zodSchema = compileSchemaCompat(weirdSchema)

    expect(() => zodSchema.safeParse({ mystery: 'anything' })).not.toThrow()
  })
})
