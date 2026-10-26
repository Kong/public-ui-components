import { describe, expect, it } from 'vitest'
import { CallNodeSchema } from './strict'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './compat'

const callNode = (fields: Record<string, unknown>) => ({ type: 'call', name: 'CALL', ...fields })

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
  })
})
