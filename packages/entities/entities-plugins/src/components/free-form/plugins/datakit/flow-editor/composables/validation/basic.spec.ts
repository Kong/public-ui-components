import { describe, expect, it } from 'vitest'
import { compose, isNumber, notEmpty, numberFormat, numberRange, stringFormat, stringLenRange } from './basic'

describe('basic validators', () => {
  it('notEmpty', () => {
    const validate = notEmpty('required')
    expect([null, undefined, '', '  '].map(validate)).toEqual(['required', 'required', 'required', 'required'])
    expect([0, false, 'a'].map(validate)).toEqual([undefined, undefined, undefined])
  })

  describe('stringFormat', () => {
    // Same pattern as the backend node name (kong-ee `typedefs.lua` KEBAB_CASE)
    it.each([
      ['NODE', true],
      ['_node-1', true],
      ['node_name', true],
      ['1node', false],
      ['-node', false],
      ['node.name', false],
      ['node name', false],
    ])('identifier %s', (value, valid) => {
      expect(stringFormat('identifier', 'invalid')(value)).toBe(valid ? undefined : 'invalid')
    })

    it.each([
      ['https://example.com/path?q=1', true],
      ['example.com', false],
    ])('url %s', (value, valid) => {
      expect(stringFormat('url', 'invalid')(value)).toBe(valid ? undefined : 'invalid')
    })
  })

  it('stringLenRange', () => {
    const validate = stringLenRange(1, 3, 'length')
    expect(['', 'a', 'abc', 'abcd'].map(validate)).toEqual(['length', undefined, undefined, 'length'])
  })

  it('isNumber', () => {
    const validate = isNumber('number')
    expect([1, '1.5', '-2'].map(validate)).toEqual([undefined, undefined, undefined])
    expect(['abc', Infinity, NaN].map(validate)).toEqual(['number', 'number', 'number'])
  })

  it('numberFormat', () => {
    expect(numberFormat('integer', 'integer')('1.5')).toBe('integer')
    expect(numberFormat('integer', 'integer')('2')).toBeUndefined()
    expect(numberFormat('float', 'float')('1.5')).toBeUndefined()
    expect(numberFormat('integer', 'integer')(undefined)).toBeUndefined()
  })

  it('numberRange', () => {
    const validate = numberRange(0, 10, 'range')
    expect([-1, 0, 10, 11].map(validate)).toEqual(['range', undefined, undefined, 'range'])
    expect(validate(undefined)).toBeUndefined()
  })

  it('compose returns the first error', () => {
    const validate = compose(notEmpty('required'), stringLenRange(0, 2, 'too long'))
    expect(validate('')).toBe('required')
    expect(validate('abc')).toBe('too long')
    expect(validate('ab')).toBeUndefined()
  })
})
