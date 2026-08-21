import { describe, expect, it } from 'vitest'
import rateLimitingSchema from '../../../fixtures/schemas/rate-limiting'
import corsSchema from '../../../fixtures/schemas/cors'
import { luaSchemaToZod } from './index'
import { translateLuaPattern } from './lua-pattern'

describe('luaSchemaToZod (POC)', () => {
  // The Admin API always nests actual plugin options under `config`; the
  // fixtures mirror that, so every payload below is `{ config: {...} }`.

  it('compiles the rate-limiting schema and accepts a valid config', () => {
    const zodSchema = luaSchemaToZod(rateLimitingSchema)

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
    const zodSchema = luaSchemaToZod(rateLimitingSchema)

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
    const zodSchema = luaSchemaToZod(rateLimitingSchema)

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
    const zodSchema = luaSchemaToZod(rateLimitingSchema)
    // `redis` is a `required: true` record (Kong still requires the record
    // itself, even though every one of its own sub-fields is optional/defaulted).
    const base = { fault_tolerant: true, sync_rate: -1, hide_client_headers: false, redis: {} }

    expect(zodSchema.safeParse({ config: { ...base, path: '/ok/path' } }).success).toBe(true)
    expect(zodSchema.safeParse({ config: { ...base, path: 'missing-leading-slash' } }).success).toBe(false)
    expect(zodSchema.safeParse({ config: { ...base, path: '/has//empty//segment' } }).success).toBe(false)
  })

  it('accepts a `{vault://...}` reference on a `referenceable` field', () => {
    const zodSchema = luaSchemaToZod(rateLimitingSchema)
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
    const zodSchema = luaSchemaToZod(corsSchema)

    const result = zodSchema.parse({ config: {} })
    // `protocols` (a set) carries a `default` in the real schema.
    expect(result.protocols).toBeDefined()
  })

  it('accepts explicit `null` on non-required fields, not just an omitted key', () => {
    // Kong itself represents "not set" as `null` in stored/returned config
    // about as often as by omitting the key.
    const zodSchema = luaSchemaToZod(rateLimitingSchema)

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
    const zodSchema = luaSchemaToZod(rateLimitingSchema)

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
    const zodSchema = luaSchemaToZod(weirdSchema)

    expect(() => zodSchema.safeParse({ mystery: 'anything' })).not.toThrow()
  })
})

describe('translateLuaPattern (POC)', () => {
  it('translates simple literal/anchor/char-class patterns', () => {
    const regex = translateLuaPattern('^[a-zA-Z0-9_-]+$')
    expect(regex).not.toBeNull()
    expect(regex!.test('valid_name-1')).toBe(true)
    expect(regex!.test('has a space')).toBe(false)
  })

  it('translates %d / %a Lua character classes', () => {
    const regex = translateLuaPattern('^%d+$')
    expect(regex).not.toBeNull()
    expect(regex!.test('12345')).toBe(true)
    expect(regex!.test('12a45')).toBe(false)
  })

  it('bails out on a bare `-` quantifier outside a character set', () => {
    // In Lua, `a-` means "zero or more `a`, lazily" - not a JS-safe rewrite.
    expect(translateLuaPattern('a-b')).toBeNull()
  })

  it('bails out on %b balanced-match patterns', () => {
    expect(translateLuaPattern('%b()')).toBeNull()
  })

  it('escapes JS-only special chars that are literal in Lua patterns', () => {
    const regex = translateLuaPattern('a|b{c}')
    expect(regex).not.toBeNull()
    expect(regex!.test('a|b{c}')).toBe(true)
    expect(regex!.test('a')).toBe(false)
  })
})
