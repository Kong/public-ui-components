import { describe, it, expect } from 'vitest'
import { deepMerge } from './deepMerge'

describe('deepMerge', () => {
  it('deep-merges nested plain objects', () => {
    const base = { tooltip: { trigger: 'axis' }, grid: { top: 40 } }
    const merged = deepMerge(base, { grid: { top: 20, left: 10 } })

    expect(merged).toEqual({ tooltip: { trigger: 'axis' }, grid: { top: 20, left: 10 } })
  })

  it('replaces non-object values and arrays instead of merging them', () => {
    const base = { color: 'red', data: [1, 2, 3] }
    const merged = deepMerge(base, { color: 'blue', data: [4] })

    expect(merged).toEqual({ color: 'blue', data: [4] })
  })

  it('does not mutate the base object', () => {
    const base = { grid: { top: 40 } }
    deepMerge(base, { grid: { top: 20 } })

    expect(base.grid.top).toBe(40)
  })

  it('ignores null, undefined and undefined-valued overrides', () => {
    const base = { color: 'red', grid: { top: 40 } }
    const merged = deepMerge(base, null, undefined, { color: undefined })

    expect(merged).toEqual({ color: 'red', grid: { top: 40 } })
  })
})
