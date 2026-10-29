import { describe, expect, it } from 'vitest'
import { DatakitConfigSchema } from './strict'

/**
 * The strict schema must be a subset of the backend constraints (kong-ee `kong/plugins/datakit`):
 * every config the backend accepts must pass, and nothing may be silently dropped.
 */
const url = 'https://example.com'

const BACKEND_VALID_CONFIGS: Array<[string, Record<string, unknown>]> = [
  ['call: method outside the common list', {
    nodes: [{ name: 'c', type: 'call', url, method: 'PURGE' }],
  }],
  ['cache: memory and redis omitted', {
    nodes: [{ name: 'c', type: 'cache' }],
    resources: { cache: { strategy: 'memory' } },
  }],
  ['connection: field name containing dots', {
    nodes: [
      { name: 's', type: 'static', values: { 'a.b': 1 } },
      { name: 'j', type: 'jq', jq: '.', input: 's.a.b' },
    ],
  }],
]

describe('Datakit strict schema', () => {
  it.each(BACKEND_VALID_CONFIGS)('accepts a backend-valid config (%s) without dropping fields', (_, config) => {
    const { data, error } = DatakitConfigSchema.safeParse(config)

    expect(error).toBeUndefined()
    expect(data).toMatchObject(config)
  })
})
