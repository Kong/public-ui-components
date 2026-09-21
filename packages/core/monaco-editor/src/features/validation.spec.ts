import { describe, expect, it, vi } from 'vitest'
import { collectValidators } from './validation'

import type { ValidateFn } from './validation'

describe('collectValidators', () => {
  it('returns no issues when there are no validators', async () => {
    expect(await collectValidators([])(1)).toEqual([])
  })

  it('concatenates issues from every validator', async () => {
    const a: ValidateFn = vi.fn(() => [{ message: 'a', path: [] }])
    const b: ValidateFn = vi.fn(() => [{ message: 'b', path: ['x'] }])

    const combined = collectValidators([a, b])
    expect(await combined('value')).toEqual([
      { message: 'a', path: [] },
      { message: 'b', path: ['x'] },
    ])
    expect(a).toHaveBeenCalledWith('value')
    expect(b).toHaveBeenCalledWith('value')
  })

  it('preserves validator order in the output regardless of resolution speed', async () => {
    const slow: ValidateFn = () => new Promise((resolve) => {
      setTimeout(() => resolve([{ message: 'slow', path: [] }]), 10)
    })
    const fast: ValidateFn = () => [{ message: 'fast', path: [] }]

    const combined = collectValidators([slow, fast])
    expect(await combined(null)).toEqual([
      { message: 'slow', path: [] },
      { message: 'fast', path: [] },
    ])
  })
})
