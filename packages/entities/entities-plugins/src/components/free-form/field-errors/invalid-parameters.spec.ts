import { describe, it, expect } from 'vitest'
import { parseInvalidParameters } from './invalid-parameters'
import { toFieldErrors } from './to-field-errors'
import type { FormSchema } from '@kong-ui-public/freeform'

describe('parseInvalidParameters', () => {
  const badRequest = (...invalidParameters: unknown[]) => ({
    status: 400,
    title: 'Bad Request',
    detail: 'Invalid request',
    invalid_parameters: invalidParameters,
  })

  it('turns each parameter into an error with a data path', () => {
    expect(parseInvalidParameters(badRequest(
      { field: 'config.minute', reason: 'value must be greater than 0', source: 'body' },
      { field: 'config.allow[0]', reason: 'invalid value', source: 'body' },
      { field: 'config.callouts[1].name', reason: 'required field missing', rule: 'required', source: 'body' },
    ))).toEqual([
      { path: 'config.minute', message: 'value must be greater than 0' },
      { path: 'config.allow.0', message: 'invalid value' },
      { path: 'config.callouts.1.name', message: 'required field missing' },
    ])
  })

  it('puts an error with an empty field on the whole entity', () => {
    expect(parseInvalidParameters(badRequest(
      { field: '', reason: "at least one of these fields must be non-empty: 'config.minute', 'config.hour'", source: 'body' },
    ))).toEqual([
      { path: '', message: "at least one of these fields must be non-empty: 'config.minute', 'config.hour'" },
    ])
  })

  it('puts the errors of a record check on the record', () => {
    expect(parseInvalidParameters(badRequest(
      { field: 'config.redis.@entity[0]', reason: "all or none of these fields must be set: 'host', 'port'" },
      { field: '@entity', reason: 'exactly one of these fields must be non-empty: \'a\', \'b\'' },
    ))).toEqual([
      { path: 'config.redis', message: "all or none of these fields must be set: 'host', 'port'" },
      { path: '', message: 'exactly one of these fields must be non-empty: \'a\', \'b\'' },
    ])
  })

  it('restores a map key with a dot from the schema', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [{
        config: {
          type: 'record',
          fields: [{ headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } }],
        },
      }],
    }
    expect(parseInvalidParameters(
      badRequest({ field: 'config.headers.x.trace', reason: 'invalid header' }),
      { schema },
    )).toEqual([{ path: 'config.headers["x.trace"]', message: 'invalid header' }])
  })

  it('skips parameters without a reason or that are not objects', () => {
    expect(parseInvalidParameters(badRequest(
      null,
      'oops',
      { field: 'config.minute' },
      { field: 'config.hour', reason: 'invalid' },
    ))).toEqual([{ path: 'config.hour', message: 'invalid' }])
  })

  it('does not recognize a body without `invalid_parameters`', () => {
    expect(parseInvalidParameters(undefined)).toBeUndefined()
    expect(parseInvalidParameters({ status: 409, title: 'Conflict', detail: 'name must be unique' })).toBeUndefined()
    // The core entities format
    expect(parseInvalidParameters({ details: [{ field: 'config.minute', messages: ['invalid'] }] })).toBeUndefined()
  })
})

describe('toFieldErrors with `invalid_parameters`', () => {
  it('parses an AI Gateway body', () => {
    expect(toFieldErrors({
      status: 400,
      invalid_parameters: [{ field: 'config.limit[1]', reason: 'expected a number', source: 'body' }],
    })).toEqual([{ path: 'config.limit.1', message: 'expected a number' }])
  })
})
