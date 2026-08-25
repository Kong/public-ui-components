import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import rateLimitingSchema from '../../../fixtures/schemas/rate-limiting'
import corsSchema from '../../../fixtures/schemas/cors'
import { compileSchemaStrict } from './compile-strict'

describe('compileSchemaStrict', () => {
  // The Admin API always nests actual plugin options under `config`; the
  // fixtures mirror that, so every payload below is `{ config: {...} }`.

  it('compiles the rate-limiting schema and accepts a valid config', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)

    const result = zodSchema.safeParse({
      config: {
        minute: 100,
        policy: 'redis',
        redis: {
          host: 'redis.internal',
          port: 6379,
          timeout: 2000,
        },
        fault_tolerant: true,
        sync_rate: -1,
        hide_client_headers: false,
        error_code: 429,
        error_message: 'slow down',
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects a number field outside its `between` range', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)

    const result = zodSchema.safeParse({
      config: {
        fault_tolerant: true,
        sync_rate: -1,
        hide_client_headers: false,
        redis: { host: 'x', port: 999999, timeout: 2000 }, // port out of [0, 65535]
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects a string not in `one_of`', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)

    const result = zodSchema.safeParse({
      config: {
        fault_tolerant: true,
        sync_rate: -1,
        hide_client_headers: false,
        limit_by: 'not-a-real-option',
      },
    })

    expect(result.success).toBe(false)
  })

  it('enforces `starts_with` + `match_none` on config.path', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)
    // `redis` is a `required: true` record (Kong still requires the record
    // itself, even though every one of its own sub-fields is optional/defaulted).
    const base = { fault_tolerant: true, sync_rate: -1, hide_client_headers: false, redis: {} }

    expect(zodSchema.safeParse({ config: { ...base, path: '/ok/path' } }).success).toBe(true)
    expect(zodSchema.safeParse({ config: { ...base, path: 'missing-leading-slash' } }).success).toBe(false)
    expect(zodSchema.safeParse({ config: { ...base, path: '/has//empty//segment' } }).success).toBe(false)
  })

  it('accepts a `{vault://...}` reference on a `referenceable` field', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)
    const base = { fault_tolerant: true, sync_rate: -1, hide_client_headers: false }

    const result = zodSchema.safeParse({
      config: {
        ...base,
        redis: { host: '{vault://env/redis-host}', port: 6379, timeout: 2000 },
      },
    })

    expect(result.success).toBe(true)
  })

  it('fills in defaults for optional fields, mirroring Kong config defaults', () => {
    const zodSchema = compileSchemaStrict(corsSchema)

    const result = zodSchema.parse({ config: {} })
    // `protocols` (a set) carries a `default` in the real schema.
    expect(result.protocols).toBeDefined()
  })

  it('accepts explicit `null` on non-required fields, not just an omitted key', () => {
    // Kong itself represents "not set" as `null` in stored/returned config
    // about as often as by omitting the key.
    const zodSchema = compileSchemaStrict(rateLimitingSchema)

    const result = zodSchema.safeParse({
      config: {
        fault_tolerant: true,
        sync_rate: -1,
        hide_client_headers: false,
        redis: {},
        minute: null, // no `required`, no `default` -> should accept null
        limit_by: null, // has a `default` -> should still accept an explicit null (not be overridden)
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      const data = result.data as any
      expect(data.config.minute).toBeNull()
      expect(data.config.limit_by).toBeNull()
    }
  })

  it('still rejects `null` on a `required: true` field', () => {
    const zodSchema = compileSchemaStrict(rateLimitingSchema)

    const result = zodSchema.safeParse({
      config: {
        fault_tolerant: null, // required: true -> null is not acceptable
        sync_rate: -1,
        hide_client_headers: false,
        redis: {},
      },
    })

    expect(result.success).toBe(false)
  })

  it('does not throw on an unrecognized field type, falls back to unknown()', () => {
    const weirdSchema = { type: 'record' as const, fields: [{ mystery: { type: 'brand-new-type' as any } }] }
    const zodSchema = compileSchemaStrict(weirdSchema)

    expect(() => zodSchema.safeParse({ mystery: 'anything' })).not.toThrow()
  })

  // `foreign` and `referenceable` fields compile to `z.union(...)`, which
  // Zod always reports as a bare "Invalid input" at the top level unless it's
  // given a custom message - the real reason ends up nested and unused.
  // Required fields additionally get a dedicated message for "missing" vs.
  // "explicitly null", ahead of whatever the underlying type would've said.
  describe('meaningful error messages on union-backed fields', () => {
    function messageFor(result: ReturnType<z.ZodTypeAny['safeParse']>, path: string) {
      if (result.success) return undefined
      return result.error.issues.find((issue) => issue.path.join('.') === path)?.message
    }

    it('reports a required `foreign` field as missing, not "Invalid input"', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ consumer: { type: 'foreign', reference: 'consumers', required: true } }],
      })

      expect(messageFor(zodSchema.safeParse({}), 'consumer')).toBe('"consumer" is required')
    })

    it('rejects an explicit `null` on a required `foreign` field', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ consumer: { type: 'foreign', reference: 'consumers', required: true } }],
      })

      expect(messageFor(zodSchema.safeParse({ consumer: null }), 'consumer')).toBe('"consumer" cannot be null')
    })

    it('still gives a real message for a wrong-shaped (but present) `foreign` value', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ consumer: { type: 'foreign', reference: 'consumers', required: true } }],
      })

      const message = messageFor(zodSchema.safeParse({ consumer: 42 }), 'consumer')
      expect(message).not.toBe('Invalid input')
      expect(message).toMatch(/id/i)
    })

    it('reports a required `referenceable` field as missing, not "Invalid input"', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ host: { type: 'string', referenceable: true, required: true } }],
      })

      expect(messageFor(zodSchema.safeParse({}), 'host')).toBe('"host" is required')
    })

    it('rejects an explicit `null` on a required `referenceable` field', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ host: { type: 'string', referenceable: true, required: true } }],
      })

      expect(messageFor(zodSchema.safeParse({ host: null }), 'host')).toBe('"host" cannot be null')
    })

    it('still gives a real message for a wrong-shaped (but present) `referenceable` value', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ host: { type: 'string', referenceable: true, required: true } }],
      })

      const message = messageFor(zodSchema.safeParse({ host: 42 }), 'host')
      expect(message).not.toBe('Invalid input')
      expect(message).toMatch(/vault/i)
    })

    it('still allows an explicit `null` on a non-required `foreign` field', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{ consumer: { type: 'foreign', reference: 'consumers', eq: null } }],
      })

      expect(zodSchema.safeParse({ consumer: null }).success).toBe(true)
    })
  })

  describe('required-field messages use the actual field name, at every nesting level', () => {
    it('uses the immediate key name for a required field nested in a record', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{
          redis: {
            type: 'record',
            required: true,
            fields: [{ host: { type: 'string', required: true } }],
          },
        }],
      })

      const result = zodSchema.safeParse({ redis: {} })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.join('.') === 'redis.host')
        expect(issue?.message).toBe('"host" is required')
      }
    })

    it('labels a required array item field relative to the array', () => {
      const zodSchema = compileSchemaStrict({
        fields: [{
          tags: {
            type: 'array',
            required: true,
            elements: { type: 'foreign', reference: 'consumers', required: true },
          },
        }],
      })

      const result = zodSchema.safeParse({ tags: [null] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('"tags item" cannot be null')
      }
    })
  })
})
