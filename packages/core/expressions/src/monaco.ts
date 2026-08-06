import * as monaco from 'monaco-editor'
import type { Schema } from './schema'
import type { ProvideCompletionItems } from './types'

interface MonarchLanguage extends monaco.languages.IMonarchLanguage {
  keywords: string[]
}

export const buildLanguageId = (schema: Schema) => `kong-expressions-${schema.name}`

/**
 * Token types emitted by the Monarch tokenizer. Their *values* are standard TextMate
 * scope names, which serves both concerns with a single vocabulary:
 *
 * - **Colouring**: the shared Shiki theme applied by `@kong-ui-public/monaco-editor`
 *   (e.g. `catppuccin-latte`) already has rules for these scopes, so tokens are coloured
 *   automatically — no custom Monaco theme is defined or activated, which keeps us clear
 *   of Shiki's overridden `monaco.editor.setTheme` (it throws on unknown themes).
 * - **Completion analysis**: the utilities below switch on these same constants (via a
 *   token's {@link Token.shortType}), so the analysis logic is insulated from the exact
 *   scope strings — change a value here and both concerns follow.
 */
export const TokenType = {
  IDENT: 'variable.other.property',
  OPERATOR: 'keyword.operator',
  QUOTE_OPEN: 'punctuation.definition.string.begin',
  QUOTE_CLOSE: 'punctuation.definition.string.end',
  STR_LITERAL: 'string.quoted.double',
  STR_ESCAPE: 'constant.character.escape',
  STR_INVALID_ESCAPE: 'invalid.illegal.escape',
  RAW_STR_OPEN: 'punctuation.definition.string.raw.begin',
  RAW_STR_CLOSE: 'punctuation.definition.string.raw.end',
  IP_V4: 'constant.numeric.ip.v4',
  IP_V6: 'constant.numeric.ip.v6',
  NUMBER: 'constant.numeric',
  WHITESPACE: 'white',
  FUNC_NAME: 'entity.name.function',
  PAREN_OPEN: 'punctuation.section.parens.begin',
  PAREN_CLOSE: 'punctuation.section.parens.end',
}

export interface Token extends monaco.Token {
  shortType: string
  lineIndex: number
  flatIndex: number
  flatOffset: number
}

/**
 * Token types are suffixed with the language ID (e.g. `keyword.operator.kong-expressions-http`).
 *
 * This function removes the language ID suffix and returns the shortened token type — one of
 * the values in the {@link TokenType} object. Because we control what the Monarch tokenizer
 * emits, stripping the suffix recovers the {@link TokenType} value exactly (no prefix matching
 * needed).
 *
 * @param languageId the language ID
 * @param fullType the full token type
 * @returns the shortened type, or the full type if it does not end with the language ID
 */
export const shortenTokenType = (languageId: string, fullType: string) => {
  if (fullType.endsWith(`.${languageId}`)) {
    return fullType.slice(0, -`.${languageId}`.length)
  }
  return fullType // fallback
}

/**
 * Locate the token that includes the given offset on the given line.
 *
 * Time complexity = O(log n)
 *
 * @param nestedTokens
 * @param lineIndex
 * @param offset
 * @returns
 */
export const locateToken = (nestedTokens: Token[][], lineIndex: number, offset: number) => {
  // Try to find the token in the current line
  if (nestedTokens[lineIndex].length > 0) {
    let left = 0
    let right = nestedTokens[lineIndex].length - 1
    let index = -1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (nestedTokens[lineIndex][mid].offset <= offset) {
        index = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    if (index >= 0) {
      return nestedTokens[lineIndex][index]
    }
  }

  // Try to find the token in the previous lines
  for (let li = lineIndex - 1; li >= 0; li--) {
    if (nestedTokens[li].length > 0) {
      return nestedTokens[li][nestedTokens[li].length - 1]
    }
  }

  return undefined
}

export const transformTokens = (model: monaco.editor.ITextModel, tokens: monaco.Token[][]): [Token[], Token[][]] => {
  const nestedTokens: Token[][] = []
  const flatTokens: Token[] = []
  let lineCumulativeOffset = 0

  for (let lineIndex = 0; lineIndex < tokens.length; lineIndex++) {
    nestedTokens.push([])
    for (const t of tokens[lineIndex]) {
      const token: Token = {
        ...t,
        shortType: shortenTokenType(model.getLanguageId(), t.type),
        lineIndex,
        flatIndex: flatTokens.length,
        flatOffset: lineCumulativeOffset + t.offset,
      }
      flatTokens.push(token)
      nestedTokens[lineIndex].push(token)
    }
    lineCumulativeOffset += model.getLineMaxColumn(lineIndex + 1)
  }

  return [flatTokens, nestedTokens]
}

/**
 * Get the range for the given tokens.
 *
 * Time complexity = O(1)
 *
 * @param model the text model
 * @param tokens the tokens to get the range from (1D array)
 * @param fromIndex the index of the first TOKEN (inclusive)
 * @param toIndex the index of the last TOKEN (exclusive)
 * @returns
 */
export const getTokensRange = (model: monaco.editor.ITextModel, tokens: Token[], fromIndex: number, toIndex: number): monaco.Range => {
  const endLineNumber = toIndex >= tokens.length ? model.getLineCount() : tokens[toIndex].lineIndex + 1
  const endColumn = toIndex >= tokens.length ? model.getLineMaxColumn(endLineNumber) : tokens[toIndex].offset + 1

  return new monaco.Range(
    fromIndex >= tokens.length ? model.getLineCount() : tokens[fromIndex].lineIndex + 1,
    fromIndex >= tokens.length ? model.getLineMaxColumn(model.getLineCount()) : tokens[fromIndex].offset + 1,
    endLineNumber,
    endColumn,
  )
}

/**
 * Scan forward (right) until the token that satisfies the condition is found.
 *
 * Time complexity = O(n)
 *
 * @param tokens the tokens to scan (1D array)
 * @param fromIndex the index of the TOKEN to start scanning from (exclusive)
 * @param until the condition to stop scanning
 * @returns the index of the TOKEN that satisfies the condition or the length of the tokens if not found
 */
export const scanTokenForward = (tokens: Token[], fromIndex: number, until: (token: Token) => boolean): number => {
  let index
  for (index = fromIndex + 1; index < tokens.length; index++) {
    if (until(tokens[index])) {
      break
    }
  }
  return index
}

/**
 * Scan backward (left) until the token that satisfies the condition is found.
 *
 * Time complexity = O(n)
 *
 * @param tokens the tokens to scan (1D array)
 * @param fromIndex the index of the TOKEN to start scanning from (exclusive)
 * @param until the condition to stop scanning
 * @returns the index of the TOKEN that satisfies the condition or `-1` if not found
 */
export const scanTokenBackward = (tokens: Token[], fromIndex: number, until: (token: Token) => boolean): number => {
  let index
  for (index = fromIndex - 1 ; index >= 0; index--) {
    if (until(tokens[index])) {
      break
    }
  }
  return index
}

/**
 * Scan the consecutive tokens from the given index backward (left) and forward (right) until the
 * condition is met. The consecutive tokens DO NOT include the tokens met by the condition on both
 * sides.
 *
 * Time complexity = O(n)
 *
 * @param model the text model
 * @param tokens the tokens to scan (1D array)
 * @param fromIndex the index to start scanning from (exclusive)
 * @param until the condition to stop scanning
 * @returns the range of the tokens and the index of the first token in the range
 */
export const scanTokensBidirectional = (model: monaco.editor.ITextModel, tokens: Token[], fromIndex: number, until: (token: Token) => boolean): [monaco.Range, number] => {
  const left = scanTokenBackward(tokens, fromIndex, until) + 1 // Adding 1 because the output range is inclusive
  const right = scanTokenForward(tokens, fromIndex, until)

  return [getTokensRange(model, tokens, left, right), left]
}

/**
 * Locate the nearest IDENT token in the possible LHS of the given token.
 * Note: This implementation is NOT OPTIMAL and only works on a best-effort basis.
 *
 * Time complexity = O(n)
 *
 * @param tokens the tokens to locate the LHS from (1D array)
 * @param fromIndex the index of the string tokens (STR_LITERAL, STR_ESCAPE, STR_INVALID_ESCAPE)
 * @returns the index of the LHS or `-1` if not found
 */
export const locateStringLhsIdent = (tokens: Token[], fromIndex: number): number => {
  let quote = false
  let op = false
  let rawStrOpen = false
  let index

  switch (tokens[fromIndex].shortType) {
    case TokenType.STR_LITERAL:
    case TokenType.STR_ESCAPE:
    case TokenType.STR_INVALID_ESCAPE:
      break
    default:
      // Invalid: Should only find IDENT in LHS from the leftmost string token in consecutive string tokens
      return -1
  }

  for (index = fromIndex - 1; index >= 0; index--) {
    const t = tokens[index]
    switch (t.shortType) {
      case TokenType.STR_LITERAL:
      case TokenType.STR_ESCAPE:
      case TokenType.STR_INVALID_ESCAPE:
        // Invalid: Should not met any string tokens as we should start from the leftmost string token
        // in consecutive string tokens
        return -1
      case TokenType.WHITESPACE:
      case TokenType.PAREN_CLOSE:
        // Skip infinite whitespace and closing parentheses
        break
      case TokenType.RAW_STR_OPEN:
        if (rawStrOpen) {
          // Invalid: Should only met a raw string open ONCE before the string tokens
          return -1
        }
        rawStrOpen = true
        break
      case TokenType.QUOTE_OPEN:
        if (quote) {
          // Invalid: Should only met a quote ONCE before the string tokens
          return -1
        }
        quote = true
        break
      case TokenType.OPERATOR:
        if (op) {
          // Invalid: Should only met an operator ONCE before the string tokens
          return -1
        }
        op = true
        break
      case TokenType.IDENT:
        return op ? index : -1
      default:
        return -1
    }
  }

  return -1
}

export const languageDisposables: Record<string, () => void> = {}

export const registerLanguage = (languageId: string, provideCompletionItems?: ProvideCompletionItems) => {
  if (monaco.languages.getEncodedLanguageId(languageId) === 0) {
    monaco.languages.register({ id: languageId })
  }

  languageDisposables[languageId]?.()
  const disposables: monaco.IDisposable[] = []

  disposables.push(
    monaco.languages.setMonarchTokensProvider(languageId, {
      keywords: [], // keywords are not used but required

      tokenizer: {
        root: [
          [/[ \t\r\n]+/, TokenType.WHITESPACE],
          [/==|!=|~|\^=|=\^|>=?|<=?|&&|\|\||(?:not )?in|contains/, TokenType.OPERATOR],

          [/(r#)(")/, [
            TokenType.RAW_STR_OPEN,
            { token: TokenType.QUOTE_OPEN, next: '@rawString' },
          ]],

          [/"/, { token: TokenType.QUOTE_OPEN, next: '@string' }],

          { include: '@lhs' },

          // IP addresses + CIDRs
          [/(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?/, TokenType.IP_V4],
          [/(?::|[A-Fa-f0-9]{1,4}):(?:[A-Fa-f0-9]{1,4}|:)*(?:\/\d{1,3})?/, TokenType.IP_V6],

          // Hexadecimal, octal, and decimal numbers
          [/-?0x[a-fA-F0-9]+/, TokenType.NUMBER],
          [/-?0[0-7]+/, TokenType.NUMBER],
          [/-?\d+/, TokenType.NUMBER],

          // Misc
          [/\(/, { token: TokenType.PAREN_OPEN, bracket: '@open' }],
          [/\)/, { token: TokenType.PAREN_CLOSE, bracket: '@close' }],
        ],

        lhs: [
          [/([a-zA-Z][a-zA-Z0-9_.]*)([ \t\r\n]*)(\()/, [
            TokenType.FUNC_NAME, TokenType.WHITESPACE, { token: TokenType.PAREN_OPEN, bracket: '@open' },
          ]],

          [/[a-zA-Z][a-zA-Z0-9_.]*/, TokenType.IDENT],
        ],

        string: [
          [/^$/, TokenType.STR_LITERAL],
          [/[^\\"]+/, TokenType.STR_LITERAL],
          [/\\[ntr\\"]/, TokenType.STR_ESCAPE],
          [/\\(?:.|$)/, TokenType.STR_INVALID_ESCAPE], // these are invalid escape sequences
          [/"/, { token: TokenType.QUOTE_CLOSE, next: '@pop' }],
        ],

        rawString: [
          [/[^"]+/, TokenType.STR_LITERAL], // characters before the closing quote
          [/(")(#)/, [
            { token: TokenType.RAW_STR_CLOSE, next: '@pop' },
            TokenType.QUOTE_CLOSE,
          ]],
          [/"/, TokenType.STR_LITERAL],
        ],

        function: [
          { include: '@lhs' },

          [/\)/, { token: TokenType.PAREN_CLOSE, bracket: '@close', next: '@pop' }],
        ],
      },
    } as MonarchLanguage),
  )

  disposables.push(
    monaco.languages.registerCompletionItemProvider(languageId, {
      // additional characters to trigger the following function
      triggerCharacters: ['.', '*', '"'],

      // function to generate object autocompletion
      provideCompletionItems: async (...args) => {
        if (!provideCompletionItems) {
          return { suggestions: [] }
        }
        return provideCompletionItems(...args)
      },
    }),
  )

  disposables.push(
    monaco.languages.setLanguageConfiguration(languageId, {
      brackets: [['(', ')']],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: [TokenType.STR_LITERAL] },
      ],
    }),
  )

  languageDisposables[languageId] = () => {
    while (disposables.length > 0) {
      disposables.pop()?.dispose()
    }
    delete languageDisposables[languageId]
  }

  return { languageId }
}

export const tokenize = monaco.editor.tokenize
