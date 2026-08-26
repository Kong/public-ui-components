import { describe, expect, it } from 'vitest'
import { translateLuaPattern } from './lua-pattern'

describe('translateLuaPattern', () => {
  it('translates simple literal/anchor/char-class patterns', () => {
    const regex = translateLuaPattern('^[a-zA-Z0-9_-]+$')
    expect(regex).not.toBeNull()
    expect(regex!.test('valid_name-1')).toBe(true)
    expect(regex!.test('has a space')).toBe(false)
  })

  it('translates %d / %a Lua character classes', () => {
    const regex = translateLuaPattern('^%d+$')
    expect(regex).not.toBeNull()
    expect(regex!.test('12345')).toBe(true)
    expect(regex!.test('12a45')).toBe(false)
  })

  it('bails out on a bare `-` quantifier outside a character set', () => {
    // In Lua, `a-` means "zero or more `a`, lazily" - not a JS-safe rewrite.
    expect(translateLuaPattern('a-b')).toBeNull()
  })

  it('bails out on %b balanced-match patterns', () => {
    expect(translateLuaPattern('%b()')).toBeNull()
  })

  it('escapes JS-only special chars that are literal in Lua patterns', () => {
    const regex = translateLuaPattern('a|b{c}')
    expect(regex).not.toBeNull()
    expect(regex!.test('a|b{c}')).toBe(true)
    expect(regex!.test('a')).toBe(false)
  })
})
