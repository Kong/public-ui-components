import { describe, it, expect } from 'vitest'
import type { FormSchema } from '@kong-ui-public/freeform'
import { parseKonnectErrors } from './konnect'
import { toFieldErrors } from './to-field-errors'

describe('parseKonnectErrors', () => {
  const field = (path: string, ...messages: string[]) => ({ type: 'ERROR_TYPE_FIELD', field: path, messages })

  it('turns field paths into data paths', () => {
    expect(parseKonnectErrors({
      details: [
        field('config.minute', 'value must be greater than 0'),
        field('config.redis.host', 'required field missing'),
        field('config.allow[0]', 'invalid value'),
        field('config.callouts[1].name', 'required field missing'),
        field('config.headers.X-Limit', 'length must be at least 8'),
      ],
    })).toEqual([
      { path: 'config.minute', message: 'value must be greater than 0' },
      { path: 'config.redis.host', message: 'required field missing' },
      { path: 'config.allow.0', message: 'invalid value' },
      { path: 'config.callouts.1.name', message: 'required field missing' },
      { path: 'config.headers.X-Limit', message: 'length must be at least 8' },
    ])
  })

  it('puts an error without a field on the whole entity', () => {
    expect(parseKonnectErrors({
      details: [{
        type: 'ERROR_TYPE_ENTITY',
        messages: ["at least one of these fields must be non-empty: 'config.minute', 'config.hour'"],
      }],
    })).toEqual([
      { path: '', message: "at least one of these fields must be non-empty: 'config.minute', 'config.hour'" },
    ])
  })

  it('puts the errors of a record check on the record', () => {
    expect(parseKonnectErrors({
      details: [
        field('config.@entity[0]', "all or none of these fields must be set: 'config.a', 'config.b'"),
        field('config.redis.@entity[1]', "only one or none of these fields must be set: 'host', 'socket'"),
        field('config.servers[2].@entity[0]', "all or none of these fields must be set: 'host', 'port'"),
        field('@entity[0]', 'invalid entity'),
      ],
    })).toEqual([
      { path: 'config', message: "all or none of these fields must be set: 'config.a', 'config.b'" },
      { path: 'config.redis', message: "only one or none of these fields must be set: 'host', 'socket'" },
      { path: 'config.servers.2', message: "all or none of these fields must be set: 'host', 'port'" },
      { path: '', message: 'invalid entity' },
    ])
  })

  it('gives each message its own error', () => {
    expect(parseKonnectErrors({
      details: [field('config.name', 'too short', 'must start with a letter')],
    })).toEqual([
      { path: 'config.name', message: 'too short' },
      { path: 'config.name', message: 'must start with a letter' },
    ])
  })

  it('quotes a map key that needs it, and keeps a path that does not parse', () => {
    expect(parseKonnectErrors({
      details: [
        field('config.headers.x"y', 'invalid header name'),
        field('config.headers.a[b', 'invalid header name'),
      ],
    })).toEqual([
      { path: 'config.headers["x\\"y"]', message: 'invalid header name' },
      { path: 'config.headers.a[b', message: 'invalid header name' },
    ])
  })

  it('skips entries without messages or that are not objects', () => {
    expect(parseKonnectErrors({
      details: [null, 'oops', { field: 'config.minute' }, field('config.hour', 'invalid')],
    })).toEqual([
      { path: 'config.hour', message: 'invalid' },
    ])
  })

  it('does not recognize a body without `details`', () => {
    expect(parseKonnectErrors(undefined)).toBeUndefined()
    expect(parseKonnectErrors(null)).toBeUndefined()
    expect(parseKonnectErrors('Bad Request')).toBeUndefined()
    expect(parseKonnectErrors({ message: 'name must be unique' })).toBeUndefined()
    // The Kong Admin API format
    expect(parseKonnectErrors({ code: 2, fields: { config: { minute: 'expected a number' } } })).toBeUndefined()
  })
})

describe('parseKonnectErrors with a schema and the submitted data', () => {
  const schema: FormSchema = {
    type: 'record',
    fields: [{
      config: {
        type: 'record',
        fields: [
          { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
          {
            lists: {
              type: 'map',
              keys: { type: 'string' },
              values: { type: 'array', elements: { type: 'string' } },
            },
          },
          {
            limits: {
              type: 'map',
              keys: { type: 'string' },
              values: {
                type: 'record',
                fields: [
                  { per_minute: { type: 'integer' } },
                  { tier: { type: 'record', fields: [{ name: { type: 'string' } }] } },
                ],
              },
            },
          },
          {
            servers: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [{ tags: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } }],
              },
            },
          },
        ],
      },
    }],
  }

  const parse = (path: string, data?: unknown) =>
    parseKonnectErrors({ details: [{ field: path, messages: ['invalid'] }] }, { schema, data })?.[0].path

  it('gives a map of scalars every segment left as the key', () => {
    expect(parse('config.headers.x.trace.id')).toBe('config.headers["x.trace.id"]')
    expect(parse('config.headers.X-Limit')).toBe('config.headers.X-Limit')
  })

  it('gives a map of arrays the segments before the index as the key', () => {
    expect(parse('config.lists.a.b[1]')).toBe('config.lists["a.b"].1')
  })

  it('tells a map key in a map of records apart with the submitted data', () => {
    const data = { config: { limits: { 'gold.tier': { per_minute: 0 }, gold: { per_minute: 1 } } } }
    expect(parse('config.limits.gold.tier.per_minute', data)).toBe('config.limits["gold.tier"].per_minute')
    expect(parse('config.limits.gold.per_minute', data)).toBe('config.limits.gold.per_minute')
  })

  it('takes the shortest key that fits when the data does not tell', () => {
    // `gold` with its `tier.name`, rather than `gold.tier` with its `name`, which doesn't fit
    expect(parse('config.limits.gold.tier.name')).toBe('config.limits.gold.tier.name')
    expect(parse('config.limits.a.b.per_minute')).toBe('config.limits["a.b"].per_minute')
  })

  it('restores keys below array items, and on record checks', () => {
    const data = { config: { limits: { 'gold.tier': { per_minute: 0 } } } }
    expect(parse('config.servers[1].tags.env.name')).toBe('config.servers.1.tags["env.name"]')
    expect(parse('config.limits.gold.tier.@entity[0]', data)).toBe('config.limits["gold.tier"]')
  })

  it('reads each part as a segment without a schema', () => {
    expect(parseKonnectErrors({ details: [{ field: 'config.headers.x.y', messages: ['invalid'] }] })?.[0].path)
      .toBe('config.headers.x.y')
  })
})

describe('toFieldErrors', () => {
  it('parses a Konnect body', () => {
    expect(toFieldErrors({
      details: [{ type: 'ERROR_TYPE_FIELD', field: 'config.limit[1]', messages: ['expected a number'] }],
    })).toEqual([{ path: 'config.limit.1', message: 'expected a number' }])
  })

  it('returns `undefined` for a format no parser knows', () => {
    expect(toFieldErrors({ message: 'Internal Server Error' })).toBeUndefined()
  })
})
