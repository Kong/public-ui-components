import { describe, expect, it } from 'vitest'
import { fieldValueToStoreValue, renameKeyAndKeepOrder, storeValueToFieldValue } from './static'

describe('static node values', () => {
  it('shows stored values as strings in the form', () => {
    expect(storeValueToFieldValue({
      text: 'abc',
      number: 123,
      flag: true,
      empty: null,
      object: { a: 1 },
      array: [1, 'b'],
    })).toEqual({
      text: 'abc',
      number: '123',
      flag: 'true',
      empty: 'null',
      object: '{"a":1}',
      array: '[1,"b"]',
    })
  })

  it('parses form strings back into JSON values', () => {
    expect(fieldValueToStoreValue({
      text: 'abc',
      number: '-1.5',
      flag: 'false',
      empty: 'null',
      object: '{"a":1}',
      array: '[1,"b"]',
    })).toEqual({
      text: 'abc',
      number: -1.5,
      flag: false,
      empty: null,
      object: { a: 1 },
      array: [1, 'b'],
    })
  })

  it('keeps strings that only look like JSON', () => {
    expect(fieldValueToStoreValue({
      broken: '{not json}',
      version: '1.2.3',
      quoted: '"abc"',
    })).toEqual({
      broken: '{not json}',
      version: '1.2.3',
      quoted: '"abc"',
    })
  })

  it('round-trips stored values through the form', () => {
    const values = { a: 'x', b: 1, c: false, d: null, e: { f: [1, 2] } }
    expect(fieldValueToStoreValue(storeValueToFieldValue(values))).toEqual(values)
  })

  it('renames a key in place', () => {
    const renamed = renameKeyAndKeepOrder({ a: 1, b: 2, c: 3 }, 'b', 'x')
    expect(Object.entries(renamed)).toEqual([['a', 1], ['x', 2], ['c', 3]])
  })
})
