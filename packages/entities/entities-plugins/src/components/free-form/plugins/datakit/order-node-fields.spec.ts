import { describe, expect, it } from 'vitest'
import { orderNodeFields } from './order-node-fields'

describe('orderNodeFields', () => {
  it('puts name and type first on every node', () => {
    const ordered = orderNodeFields({
      config: { nodes: [{ jq: '.', type: 'jq', input: 'request.body', name: 'JQ' }, { type: 'exit' }] },
    }) as { config: { nodes: object[] } }

    expect(ordered.config.nodes.map(Object.keys)).toEqual([
      ['name', 'type', 'jq', 'input'],
      ['type'],
    ])
  })

  it.each([
    ['a non-object', 'text'],
    ['no config', {}],
    ['no node list', { config: { nodes: 'x' } }],
  ])('returns %s unchanged', (_, value) => {
    expect(orderNodeFields(value)).toBe(value)
  })
})
