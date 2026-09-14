import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createZodValidator } from './zod-validation'

describe('createZodValidator', () => {
  it('returns no issues when the schema reports success', () => {
    const validate = createZodValidator(z.object({ ok: z.boolean() }))

    expect(validate({ ok: true })).toEqual([])
  })

  it('maps issues, carrying the path and the Zod issue code', () => {
    const schema = z.object({
      config: z.object({
        redis: z.object({ port: z.number().max(65535) }),
      }),
    })

    const issues = validate(schema, { config: { redis: { port: 999999 } } })

    expect(issues).toEqual([
      expect.objectContaining({
        path: ['config', 'redis', 'port'],
        code: 'too_big',
      }),
    ])
  })

  it('reports a top-level issue with an empty path', () => {
    const schema = z.string()

    const issues = validate(schema, 123)

    expect(issues).toEqual([
      expect.objectContaining({ path: [], code: 'invalid_type' }),
    ])
  })

  it('strips the redundant "Invalid input:" prefix from Zod\'s stock messages', () => {
    const issues = validate(z.string(), 123)

    expect(issues[0]?.message).toBe('expected string, received number')
  })

  it('leaves a bare "Invalid input" (no colon/suffix) message alone', () => {
    // A union with no custom `error` reports exactly this, with nothing
    // after it - stripping the prefix would otherwise leave an empty string.
    const issues = validate(z.union([z.string(), z.number()]), true)

    expect(issues[0]?.message).toBe('Invalid input')
  })

  function validate(schema: z.ZodType, value: unknown) {
    return createZodValidator(schema)(value)
  }
})
