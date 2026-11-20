import { describe, it, expect } from 'vitest'
import { getMessageParts } from './message-fields'
import type { FormSchema } from '@kong-ui-public/freeform'

describe('getMessageParts', () => {
  const schema: FormSchema = {
    type: 'record',
    fields: [{
      config: {
        type: 'record',
        fields: [
          { minute: { type: 'integer' } },
          { hour: { type: 'integer' } },
          {
            redis: {
              type: 'record',
              fields: [{ host: { type: 'string' } }, { port: { type: 'integer' } }],
            },
          },
          { policy: { type: 'string' } },
        ],
      },
    }],
  }

  it('links the fields of a check on the whole entity, without their quotes', () => {
    expect(getMessageParts(
      "at least one of these fields must be non-empty: 'config.minute', 'config.hour'",
      '',
      schema,
    )).toEqual([
      { text: 'at least one of these fields must be non-empty: ' },
      { text: 'config.minute', path: 'config.minute' },
      { text: ', ' },
      { text: 'config.hour', path: 'config.hour' },
    ])
  })

  it('resolves the names against the record the error is on', () => {
    expect(getMessageParts("all or none of these fields must be set: 'host', 'port'", 'config.redis', schema))
      .toEqual([
        { text: 'all or none of these fields must be set: ' },
        { text: 'host', path: 'config.redis.host' },
        { text: ', ' },
        { text: 'port', path: 'config.redis.port' },
      ])
    // A nested name, from a check on `config`
    expect(getMessageParts("at least one of these fields must be non-empty: 'redis.host'", 'config', schema))
      .toEqual([
        { text: 'at least one of these fields must be non-empty: ' },
        { text: 'redis.host', path: 'config.redis.host' },
      ])
  })

  it('falls back to a name from the root', () => {
    expect(getMessageParts("failed conditional validation given value of field 'config.policy'", 'config.redis', schema))
      .toEqual([
        { text: 'failed conditional validation given value of field ' },
        { text: 'config.policy', path: 'config.policy' },
      ])
  })

  it('keeps a quoted name the schema does not have as text', () => {
    expect(getMessageParts("value must be one of: 'local', 'redis'", 'config.policy', schema))
      .toEqual([{ text: "value must be one of: 'local', 'redis'" }])
    expect(getMessageParts("'minutes' is not a field, but 'minute' is", 'config', schema))
      .toEqual([
        { text: "'minutes' is not a field, but " },
        { text: 'minute', path: 'config.minute' },
        { text: ' is' },
      ])
  })

  it('returns the message as it is without a schema or quotes', () => {
    expect(getMessageParts("at least one of: 'config.minute'", '')).toEqual([{ text: "at least one of: 'config.minute'" }])
    expect(getMessageParts('required field missing', 'config.minute', schema)).toEqual([{ text: 'required field missing' }])
  })
})
