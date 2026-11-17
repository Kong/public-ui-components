import { describe, it, expect } from 'vitest'
import { getErrorLabel } from './error-label'
import type { FormSchema } from '@kong-ui-public/freeform'

describe('getErrorLabel', () => {
  const schema: FormSchema = {
    type: 'record',
    fields: [
      { protocols: { type: 'set', elements: { type: 'string' } } },
      {
        config: {
          type: 'record',
          fields: [
            { redis: { type: 'record', fields: [{ ssl_verify: { type: 'boolean' } }] } },
            { paths: { type: 'array', elements: { type: 'string' } } },
            {
              servers: {
                type: 'array',
                elements: { type: 'record', fields: [{ port: { type: 'integer' } }] },
              },
            },
            { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
            {
              limits: {
                type: 'map',
                keys: { type: 'string' },
                values: { type: 'record', fields: [{ per_minute: { type: 'integer' } }] },
              },
            },
          ],
        },
      },
    ],
  }

  it('labels record fields the way the form does, without `config`', () => {
    expect(getErrorLabel('config.redis.ssl_verify', schema)).toBe('Redis › SSL verify')
  })

  it('numbers array and set items from 1', () => {
    expect(getErrorLabel('config.paths.1', schema)).toBe('Paths #2')
    expect(getErrorLabel('config.servers.0.port', schema)).toBe('Servers #1 › Port')
    expect(getErrorLabel('config.servers[2].port', schema)).toBe('Servers #3 › Port')
    expect(getErrorLabel('protocols.0', schema)).toBe('Protocols #1')
  })

  it('quotes map keys as they are', () => {
    expect(getErrorLabel('config.headers.X-Limit', schema)).toBe('Headers › "X-Limit"')
    expect(getErrorLabel('config.headers["x.trace"]', schema)).toBe('Headers › "x.trace"')
    expect(getErrorLabel('config.limits.gold.per_minute', schema)).toBe('Limits › "gold" › Per minute')
  })

  it('keeps `config` when it is the whole path', () => {
    expect(getErrorLabel('config', schema)).toBe('Config')
  })

  it('labels each segment as a field when the schema does not describe it', () => {
    expect(getErrorLabel('config.no_such.field_name', schema)).toBe('No such › Field name')
    expect(getErrorLabel('config.redis.ssl_verify')).toBe('Redis › SSL verify')
  })

  it('returns an empty label for the whole entity, and a malformed path as it is', () => {
    expect(getErrorLabel('', schema)).toBe('')
    expect(getErrorLabel('config.headers["x', schema)).toBe('config.headers["x')
  })
})
