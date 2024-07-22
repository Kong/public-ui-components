import { describe, it, expect } from 'vitest'
import composables from '..'

const { convertKeyToTitle } = composables.useStringHelpers()

describe('convertKeyToTitle()', () => {
  it('formats to title case', () => {
    const str = 'cool_text'
    const formattedStr = convertKeyToTitle(str)

    expect(formattedStr).toBe('Cool Text')
  })

  it('allows overriding separator', () => {
    const str = 'cool-text'
    const formattedStr = convertKeyToTitle(str, '-')

    expect(formattedStr).toBe('Cool Text')
  })

  it('formats key with \'id\' correctly', () => {
    const str = 'awesome_id'
    const formattedStr = convertKeyToTitle(str)

    expect(formattedStr).toBe('Awesome ID')
  })
})
