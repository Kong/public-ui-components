import { describe, it, expect } from 'vitest'
import { meetsDependency, renderRuleExactMatch } from './render-rules'

describe('meetsDependency', () => {
  describe('primitive / deep equality', () => {
    it('matches equal primitives', () => {
      expect(meetsDependency('a', 'a')).toBe(true)
      expect(meetsDependency(1, 1)).toBe(true)
      expect(meetsDependency(true, true)).toBe(true)
    })

    it('rejects unequal primitives', () => {
      expect(meetsDependency('a', 'b')).toBe(false)
      expect(meetsDependency(1, 2)).toBe(false)
    })

    it('treats null/undefined via deep equality', () => {
      expect(meetsDependency(null, null)).toBe(true)
      expect(meetsDependency(undefined, null)).toBe(false)
      expect(meetsDependency(null, 'x')).toBe(false)
    })

    it('deeply compares plain objects', () => {
      expect(meetsDependency({ type: 'redis' }, { type: 'redis' })).toBe(true)
      expect(meetsDependency({ type: 'redis' }, { type: 'local' })).toBe(false)
    })
  })

  describe('array = any-of', () => {
    it('matches when the value equals any element', () => {
      expect(meetsDependency('a', ['a', 'b'])).toBe(true)
      expect(meetsDependency('b', ['a', 'b'])).toBe(true)
    })

    it('rejects when the value matches no element', () => {
      expect(meetsDependency('c', ['a', 'b'])).toBe(false)
    })
  })

  describe('renderRuleExactMatch = exact deep equality', () => {
    it('matches when the array equals exactly', () => {
      expect(meetsDependency(['x', 'y'], renderRuleExactMatch(['x', 'y']))).toBe(true)
    })

    it('rejects a partial array match', () => {
      expect(meetsDependency(['x'], renderRuleExactMatch(['x', 'y']))).toBe(false)
    })

    it('does not treat a plain element as an any-of match', () => {
      // 'x' is an element of ['x','y'] but must NOT satisfy an exact-match wrapper
      expect(meetsDependency('x', renderRuleExactMatch(['x', 'y']))).toBe(false)
    })
  })
})
