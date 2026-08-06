import { describe, it, expect } from 'vitest'
import { matchPluginName, buildHighlightSegments } from './helper'

describe('matchPluginName', () => {
  // Convenience: render the matched characters so assertions read clearly.
  const highlighted = (name: string, indices: number[]) => indices.map(i => name[i]).join('')

  describe('empty query', () => {
    it('matches everything with an empty query', () => {
      const result = matchPluginName('', 'Basic Authentication')
      expect(result.matched).toBe(true)
      expect(result.indices).toEqual([])
      expect(result.score).toBe(0)
    })
  })

  describe('tier 0 — prefix', () => {
    it('matches when the name starts with the query', () => {
      const result = matchPluginName('acc', 'Access Control')
      expect(result.matched).toBe(true)
      expect(result.indices).toEqual([0, 1, 2])
      expect(highlighted('Access Control', result.indices)).toBe('Acc')
    })

    it('is case-insensitive', () => {
      const result = matchPluginName('ACCESS', 'Access Control')
      expect(result.matched).toBe(true)
      expect(result.indices).toEqual([0, 1, 2, 3, 4, 5])
    })

    it('ranks a prefix match above every other tier', () => {
      const prefix = matchPluginName('ace', 'Ace Redirect')
      const acronym = matchPluginName('ace', 'Access Control Enforcement')
      expect(prefix.score).toBeLessThan(acronym.score)
    })
  })

  describe('tier 1 — acronym (word initials)', () => {
    it('matches the leading letters of consecutive words', () => {
      const name = 'Access Control Enforcement'
      const result = matchPluginName('ace', name)
      expect(result.matched).toBe(true)
      expect(highlighted(name, result.indices)).toBe('ACE')
      // A@0, C@7, E@15
      expect(result.indices).toEqual([0, 7, 15])
    })

    it('allows intervening words to be skipped', () => {
      const name = 'Access Control Enforcement'
      const result = matchPluginName('ae', name)
      expect(result.matched).toBe(true)
      expect(highlighted(name, result.indices)).toBe('AE')
      expect(result.indices).toEqual([0, 15])
    })

    it('ranks acronym matches above substring matches', () => {
      const acronym = matchPluginName('ace', 'Access Control Enforcement')
      const substring = matchPluginName('ace', 'Palace Entrance')
      expect(acronym.score).toBeLessThan(substring.score)
    })
  })

  describe('tier 2 — substring', () => {
    it('matches a consecutive run that is not at the start', () => {
      const name = 'Rate Limiting'
      const result = matchPluginName('imit', name)
      expect(result.matched).toBe(true)
      expect(highlighted(name, result.indices)).toBe('imit')
    })

    it('ranks an earlier substring position higher', () => {
      const early = matchPluginName('at', 'Rate Control') // "r[at]e..." -> index 1
      const late = matchPluginName('at', 'Corporate') // "corpor[at]e" -> index 6
      expect(early.score).toBeLessThan(late.score)
    })
  })

  describe('tier 3 — scattered subsequence', () => {
    it('matches letters in order but scattered', () => {
      const name = 'Basic Authentication'
      const result = matchPluginName('ace', name)
      expect(result.matched).toBe(true)
      // greedy leftmost: a@1, c@4, e in "authentication"
      expect(highlighted(name, result.indices)).toBe('ace')
      expect(result.score).toBeGreaterThanOrEqual(3000)
    })

    it('does not match when letters are out of order', () => {
      const result = matchPluginName('ba', 'Cab') // needs b then a, but 'a' precedes 'b'
      expect(result.matched).toBe(false)
      expect(result.score).toBe(Infinity)
    })

    it('ranks a subsequence match below acronym and substring', () => {
      const subsequence = matchPluginName('ace', 'Basic Authentication')
      const acronym = matchPluginName('ace', 'Access Control Enforcement')
      expect(subsequence.score).toBeGreaterThan(acronym.score)
    })
  })

  describe('tier 4 — id prefix fallback', () => {
    it('matches when the id starts with the query and the name does not match', () => {
      const result = matchPluginName('ai-prompt-decorator', 'AI Prompt Decorator', 'ai-prompt-decorator')
      expect(result.matched).toBe(true)
      // id matches carry no highlight (the UI highlights the name only)
      expect(result.indices).toEqual([])
      expect(result.score).toBe(4000)
    })

    it('matches a partial id prefix', () => {
      const result = matchPluginName('ai-prompt', 'AI Prompt Decorator', 'ai-prompt-decorator')
      expect(result.matched).toBe(true)
      expect(result.indices).toEqual([])
    })

    it('is strict: does not match the middle of an id', () => {
      const result = matchPluginName('prompt-decorator', 'AI Prompt Decorator', 'ai-prompt-decorator')
      expect(result.matched).toBe(false)
    })

    it('prefers a name match over the id fallback', () => {
      // "ai" matches the name prefix, so we should get a strong (name) match, not the id tier
      const result = matchPluginName('ai', 'AI Prompt Decorator', 'ai-prompt-decorator')
      expect(result.matched).toBe(true)
      expect(result.indices).toEqual([0, 1])
      expect(result.score).toBe(0)
    })

    it('ignores the id when it is not provided', () => {
      const result = matchPluginName('ai-prompt-decorator', 'AI Prompt Decorator')
      expect(result.matched).toBe(false)
    })

    it('ranks an id-prefix match below every name match', () => {
      const idMatch = matchPluginName('ai-prompt-decorator', 'AI Prompt Decorator', 'ai-prompt-decorator')
      const worstNameMatch = matchPluginName('ace', 'Basic Authentication') // tier 3
      expect(idMatch.score).toBeGreaterThan(worstNameMatch.score)
    })
  })

  describe('no match', () => {
    it('returns unmatched when nothing lines up', () => {
      const result = matchPluginName('zzz', 'Rate Limiting', 'rate-limiting')
      expect(result.matched).toBe(false)
      expect(result.indices).toEqual([])
      expect(result.score).toBe(Infinity)
    })
  })
})

describe('buildHighlightSegments', () => {
  it('returns a single plain segment when there are no indices', () => {
    expect(buildHighlightSegments('Rate Limiting')).toEqual([
      { text: 'Rate Limiting', highlighted: false },
    ])
  })

  it('returns an empty array for empty text', () => {
    expect(buildHighlightSegments('', [])).toEqual([])
  })

  it('highlights a leading run', () => {
    expect(buildHighlightSegments('Access', [0, 1, 2])).toEqual([
      { text: 'Acc', highlighted: true },
      { text: 'ess', highlighted: false },
    ])
  })

  it('highlights a trailing run', () => {
    expect(buildHighlightSegments('Access', [4, 5])).toEqual([
      { text: 'Acce', highlighted: false },
      { text: 'ss', highlighted: true },
    ])
  })

  it('highlights scattered single characters', () => {
    // indices 0, 2, 4 of "abcde" -> a, c, e highlighted
    expect(buildHighlightSegments('abcde', [0, 2, 4])).toEqual([
      { text: 'a', highlighted: true },
      { text: 'b', highlighted: false },
      { text: 'c', highlighted: true },
      { text: 'd', highlighted: false },
      { text: 'e', highlighted: true },
    ])
  })

  it('is order-independent for the indices', () => {
    expect(buildHighlightSegments('Access', [2, 0, 1])).toEqual([
      { text: 'Acc', highlighted: true },
      { text: 'ess', highlighted: false },
    ])
  })

  it('ignores out-of-range indices', () => {
    expect(buildHighlightSegments('AI', [0, 5])).toEqual([
      { text: 'A', highlighted: true },
      { text: 'I', highlighted: false },
    ])
  })
})
