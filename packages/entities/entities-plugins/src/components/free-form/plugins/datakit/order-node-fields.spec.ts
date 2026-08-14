import { describe, expect, it } from 'vitest'
import { orderNodeFields } from './order-node-fields'

describe('orderNodeFields', () => {
  it('moves name and type before the other fields without reordering the rest', () => {
    const value = {
      config: {
        nodes: [{
          input: 'request.body',
          type: 'jq',
          jq: '.',
          name: 'TRANSFORM',
          output: 'response.body',
        }],
      },
    }

    const result = orderNodeFields(value) as typeof value

    expect(Object.keys(result.config.nodes[0])).toEqual([
      'name',
      'type',
      'input',
      'jq',
      'output',
    ])
    expect(Object.keys(value.config.nodes[0])).toEqual([
      'input',
      'type',
      'jq',
      'name',
      'output',
    ])
  })

  it('does not add missing name or type fields', () => {
    const value = {
      config: {
        nodes: [{ input: 'request.body' }],
      },
    }

    const result = orderNodeFields(value) as typeof value

    expect(Object.keys(result.config.nodes[0])).toEqual(['input'])
  })

  it.each([null, {}, { config: {} }])('leaves non-Datakit values unchanged', (value) => {
    expect(orderNodeFields(value)).toBe(value)
  })
})
