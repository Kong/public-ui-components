import { describe, expect, it } from 'vitest'
import { CallNodeSchema, DatakitConfigSchema } from './strict'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './compat'

const callNode = (fields: Record<string, unknown>) => ({ type: 'call', name: 'CALL', ...fields })

/** A failover flow: the call node handles its own failure and a jq node reads `PRIMARY.error`. */
const failoverConfig = {
  nodes: [
    {
      type: 'call',
      name: 'PRIMARY',
      url: 'https://api1.example.com/orders',
      continue_on_error: true,
      retry: { count: 2, interval: 1, status_codes: ['5xx'] },
    },
    {
      type: 'jq',
      name: 'PRIMARY_FAILED',
      inputs: { status: 'PRIMARY.status', error: 'PRIMARY.error' },
      jq: '.error != null or (.status // 0) < 200 or (.status // 0) > 299',
    },
  ],
}

describe('call node schema', () => {
  describe('strict', () => {
    it('accepts error handling fields', () => {
      const result = CallNodeSchema.safeParse(callNode({
        continue_on_error: true,
        retry: { count: 3, interval: 0.5, status_codes: ['429', '5xx'] },
        outputs: { error: 'service_request.body' },
      }))

      expect(result.success).toBe(true)
    })

    it('accepts a failover flow reading the `error` output', () => {
      expect(DatakitConfigSchema.safeParse(failoverConfig).success).toBe(true)
    })

    it.each([
      ['count above 10', { count: 11 }],
      ['fractional count', { count: 1.5 }],
      ['interval above 30', { interval: 31 }],
      ['empty status codes', { status_codes: [] }],
      ['upper case status class', { status_codes: ['5XX'] }],
      ['status code out of range', { status_codes: ['600'] }],
      ['unknown field', { backoff: 'exponential' }],
    ])('rejects retry with %s', (_, retry) => {
      expect(CallNodeSchema.safeParse(callNode({ retry })).success).toBe(false)
    })
  })

  describe('compat', () => {
    it('keeps a config with error handling fields available in the flow editor', () => {
      const result = DatakitConfigCompatSchema.safeParse({
        nodes: [
          callNode({
            continue_on_error: true,
            retry: { count: 3, status_codes: ['5xx'] },
            outputs: { error: 'response.body' },
          }),
        ],
      })

      expect(result.success).toBe(true)
    })

    it('keeps a failover flow reading the `error` output available in the flow editor', () => {
      expect(DatakitConfigCompatSchema.safeParse(failoverConfig).success).toBe(true)
    })
  })
})
