import { describe, expect, it, vi } from 'vitest'
import { buildLanguageId, locateStringLhsIdent, scanTokenBackward, scanTokenForward, shortenTokenType, TokenType } from './monaco'
import type { Token } from './monaco'

// The utilities under test are pure — they never touch the Monaco runtime — so we
// mock `monaco-editor` to avoid loading the (jsdom-hostile, slow) real module. Only
// the members referenced at import time need to exist here. `vi.mock` is hoisted
// above the imports above by Vitest, so the mock is in place before `./monaco` loads.
vi.mock('monaco-editor', () => ({
  editor: { tokenize: vi.fn() },
  languages: {},
  Range: class {},
}))

/** Minimal token stub — the functions below only ever read `shortType`. */
const tok = (shortType: string): Token => ({ shortType }) as Token

describe('buildLanguageId', () => {
  it('namespaces the language id by schema name', () => {
    expect(buildLanguageId({ name: 'http' } as any)).toBe('kong-expressions-http')
    expect(buildLanguageId({ name: 'stream' } as any)).toBe('kong-expressions-stream')
  })
})

describe('shortenTokenType', () => {
  const languageId = 'kong-expressions-http'

  it('strips the trailing language-id suffix to recover the TokenType value', () => {
    for (const scope of Object.values(TokenType)) {
      expect(shortenTokenType(languageId, `${scope}.${languageId}`)).toBe(scope)
    }
  })

  it('returns the type unchanged when it does not carry the language-id suffix', () => {
    // Monaco emits bare fallback types (e.g. `source`) for unmatched input.
    expect(shortenTokenType(languageId, 'source')).toBe('source')
    expect(shortenTokenType(languageId, '')).toBe('')
  })

  it('does not strip a suffix belonging to a different language id', () => {
    const other = 'keyword.operator.kong-expressions-stream'
    expect(shortenTokenType(languageId, other)).toBe(other)
  })
})

describe('scanTokenForward', () => {
  const tokens = [TokenType.IDENT, TokenType.WHITESPACE, TokenType.OPERATOR, TokenType.WHITESPACE].map(tok)

  it('finds the first matching token strictly after fromIndex', () => {
    expect(scanTokenForward(tokens, 0, t => t.shortType === TokenType.OPERATOR)).toBe(2)
  })

  it('excludes fromIndex itself', () => {
    expect(scanTokenForward(tokens, 2, t => t.shortType === TokenType.OPERATOR)).toBe(4) // length, i.e. not found
  })

  it('returns tokens.length when no token matches', () => {
    expect(scanTokenForward(tokens, 0, () => false)).toBe(tokens.length)
  })
})

describe('scanTokenBackward', () => {
  const tokens = [TokenType.IDENT, TokenType.WHITESPACE, TokenType.OPERATOR, TokenType.WHITESPACE].map(tok)

  it('finds the first matching token strictly before fromIndex', () => {
    expect(scanTokenBackward(tokens, 3, t => t.shortType === TokenType.OPERATOR)).toBe(2)
  })

  it('excludes fromIndex itself', () => {
    expect(scanTokenBackward(tokens, 2, t => t.shortType === TokenType.OPERATOR)).toBe(-1)
  })

  it('returns -1 when no token matches', () => {
    expect(scanTokenBackward(tokens, 3, () => false)).toBe(-1)
  })
})

describe('locateStringLhsIdent', () => {
  // Tokens for: http.path == "abc"  →  IDENT WS OP WS QUOTE_OPEN STR_LITERAL
  const validTokens = [
    TokenType.IDENT,
    TokenType.WHITESPACE,
    TokenType.OPERATOR,
    TokenType.WHITESPACE,
    TokenType.QUOTE_OPEN,
    TokenType.STR_LITERAL,
  ].map(tok)

  it('locates the LHS identifier when the string is on the RHS of an operator', () => {
    expect(locateStringLhsIdent(validTokens, 5)).toBe(0)
  })

  it('returns -1 when fromIndex is not a string token', () => {
    expect(locateStringLhsIdent(validTokens, 0)).toBe(-1)
  })

  it('returns -1 when there is no operator before the string (bare identifier)', () => {
    // http.path "abc"  →  IDENT WS QUOTE_OPEN STR_LITERAL (no operator)
    const tokens = [TokenType.IDENT, TokenType.WHITESPACE, TokenType.QUOTE_OPEN, TokenType.STR_LITERAL].map(tok)
    expect(locateStringLhsIdent(tokens, 3)).toBe(-1)
  })

  it('returns -1 when more than one operator precedes the string', () => {
    const tokens = [
      TokenType.IDENT,
      TokenType.OPERATOR,
      TokenType.OPERATOR,
      TokenType.QUOTE_OPEN,
      TokenType.STR_LITERAL,
    ].map(tok)
    expect(locateStringLhsIdent(tokens, 4)).toBe(-1)
  })

  it('skips whitespace and closing parens while scanning left', () => {
    // lower(http.path) == "abc"  →  ... IDENT PAREN_CLOSE WS OP WS QUOTE_OPEN STR_LITERAL
    const tokens = [
      TokenType.IDENT, // 0 (the LHS ident inside the fn call)
      TokenType.PAREN_CLOSE, // 1
      TokenType.WHITESPACE, // 2
      TokenType.OPERATOR, // 3
      TokenType.WHITESPACE, // 4
      TokenType.QUOTE_OPEN, // 5
      TokenType.STR_LITERAL, // 6
    ].map(tok)
    expect(locateStringLhsIdent(tokens, 6)).toBe(0)
  })

  it('returns -1 when called from a non-leftmost consecutive string token', () => {
    // Two consecutive string tokens; scanning from the right one must bail.
    const tokens = [
      TokenType.IDENT,
      TokenType.OPERATOR,
      TokenType.QUOTE_OPEN,
      TokenType.STR_LITERAL,
      TokenType.STR_ESCAPE,
    ].map(tok)
    expect(locateStringLhsIdent(tokens, 4)).toBe(-1)
  })
})
