import { describe, it, expect, vi } from 'vitest'
import { reactive } from 'vue'
import { createFieldErrors } from './errors'
import { buildSchemaMap, generalizePath } from './schema'

import type { FormSchema } from '../form-schema'
import type { FieldError, KeyId } from '../types'

const schema: FormSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string' } },
    {
      tls: {
        type: 'record',
        fields: [{ client_cert: { type: 'string' } }],
      },
    },
    { cache: { type: 'record', fields: [{ ttl: { type: 'integer' } }] } },
    { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
    { tags: { type: 'set', elements: { type: 'string' } } },
    { metadata: { type: 'json', json_schema: {} } },
    { servers: { type: 'array', elements: { type: 'record', fields: [{ port: { type: 'integer' } }] } } },
    { redis: { type: 'record', fields: [{ host: { type: 'string' } }] } },
  ],
}
const schemaMap = buildSchemaMap(schema)
const getSchema = (path: string) => schemaMap[generalizePath(path, schemaMap)]

const keys: Record<KeyId, string> = { 'kid:1': 'X-Request-Id', 'kid:2': 'x.y' }
const getKey = (id: KeyId) => keys[id]

// The form data as the form keeps it: map entries keyed by key IDs
const formData = reactive({
  name: '',
  tls: { client_cert: 'cert' },
  cache: null,
  headers: { 'kid:1': 'abc', 'kid:2': 'dotted' },
  tags: ['a', 'B'],
  metadata: { a: 1 },
  servers: [{ port: 1 }, { port: 70000 }],
  redis: { host: '' },
})

function setup(errors: FieldError[], onChange = vi.fn()) {
  return createFieldErrors({
    errors,
    formData,
    getSchema,
    getKey,
    isFieldHidden: path => path === 'redis',
    onChange,
  })
}

describe('createFieldErrors', () => {
  it.each([
    ['name', 'name'],
    ['tls.client_cert', 'tls.client_cert'],
    ['servers.1.port', 'servers.1.port'],
    ['headers.X-Request-Id', 'headers.kid:1'],
    ['headers["x.y"]', 'headers.kid:2'],
    // A set or a JSON value is one field, so it shows the errors inside it
    ['tags.1', 'tags'],
    ['metadata.a.b', 'metadata'],
  ])('should give the error at %s to the field %s', (path, fieldPath) => {
    const error = { path, message: 'invalid' }
    const { getFieldErrors, unmatchedErrors } = setup([error])

    expect(getFieldErrors(fieldPath, false)).toEqual([error])
    expect(unmatchedErrors.value).toEqual([])
  })

  it.each([
    ['not in the schema', 'no_such.field'],
    ['a map key that is not in the data', 'headers.missing'],
    ['under a record without a value', 'cache.ttl'],
    ['under an array item that does not exist', 'servers.5.port'],
    ['at an array item that does not exist', 'servers.5'],
    ['hidden by a render rule', 'redis.host'],
    ['malformed', 'headers["x.y"'],
  ])('should leave an error %s unmatched', (_, path) => {
    const error = { path, message: 'invalid' }
    const { getFieldErrors, unmatchedErrors } = setup([error])

    expect(unmatchedErrors.value).toEqual([error])
    expect(getFieldErrors('')).toEqual([])
  })

  it('should give a field its own errors, or with `deep` the errors below it too', () => {
    const own = { path: 'tls', message: 'own' }
    const child = { path: 'tls.client_cert', message: 'child' }
    const { getFieldErrors } = setup([own, child])

    expect(getFieldErrors('tls', false)).toEqual([own])
    expect(getFieldErrors('tls')).toEqual([own, child])
  })

  it('should not give a field the errors of a sibling that shares its prefix', () => {
    const { getFieldErrors } = setup([{ path: 'tls.client_cert', message: 'invalid' }])

    expect(getFieldErrors('tls.client')).toEqual([])
  })
})

describe('createFieldErrors: structure changes', () => {
  const error = (path: string) => ({ path, message: path })

  it('should drop the errors of a removed array item and move the ones after it', () => {
    const onChange = vi.fn()
    const { onArrayItemRemoved } = setup([
      error('servers'),
      error('servers.0.port'),
      error('servers.1.port'),
      error('servers.2.port'),
      error('name'),
    ], onChange)

    onArrayItemRemoved('servers', 1)

    expect(onChange).toHaveBeenCalledWith([
      error('servers'),
      error('servers.0.port'),
      { path: 'servers.1.port', message: 'servers.2.port' },
      error('name'),
    ])
  })

  it('should move the errors of a map entry to its new key, with brackets where needed', () => {
    const onChange = vi.fn()
    const { onMapKeyRenamed } = setup([error('headers.X-Request-Id'), error('headers["x.y"]')], onChange)

    onMapKeyRenamed('headers', 'X-Request-Id', 'a.b')

    expect(onChange).toHaveBeenCalledWith([
      { path: 'headers["a.b"]', message: 'headers.X-Request-Id' },
      error('headers["x.y"]'),
    ])
  })

  it('should drop the errors of a removed map entry', () => {
    const onChange = vi.fn()
    const { onMapKeyRemoved } = setup([error('headers.X-Request-Id'), error('headers["x.y"]')], onChange)

    onMapKeyRemoved('headers', 'x.y')

    expect(onChange).toHaveBeenCalledWith([error('headers.X-Request-Id')])
  })

  it('should not emit when no error is under the changed container', () => {
    const onChange = vi.fn()
    const { onArrayItemRemoved } = setup([error('name'), error('headers.X-Request-Id')], onChange)

    onArrayItemRemoved('servers', 0)

    expect(onChange).not.toHaveBeenCalled()
  })
})
