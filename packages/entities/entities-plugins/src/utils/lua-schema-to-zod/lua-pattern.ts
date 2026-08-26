/**
 * Best-effort translator from Kong's Lua pattern syntax (used in `match` /
 * `match_all` / `match_none` / `match_any`) to a JS RegExp.
 *
 * Lua patterns are NOT PCRE/JS regex: no alternation (`|`), no `{n,m}` bounded
 * repetition, `-` after an item is a *lazy* "0 or more" quantifier (unlike
 * JS's greedy `*`), and character classes use `%d %a %s %w ...` instead of
 * `\d \w \s`. A naive `new RegExp(pattern)` on a Lua pattern can silently
 * validate the wrong thing, which is worse than not validating at all.
 *
 * This translator only handles constructs it can map with confidence and
 * returns `null` for anything else (bare `-` quantifiers outside `[...]`,
 * `%b`/`%f`, unknown `%x` escapes). Callers should skip the check client-side
 * when `null` comes back, and rely on the server's real (Lua) validation.
 */

const CHAR_CLASSES: Record<string, string> = {
  a: '[A-Za-z]',
  A: '[^A-Za-z]',
  d: '\\d',
  D: '\\D',
  l: '[a-z]',
  L: '[^a-z]',
  s: '\\s',
  S: '\\S',
  u: '[A-Z]',
  U: '[^A-Z]',
  w: '[A-Za-z0-9]',
  W: '[^A-Za-z0-9]',
  x: '[0-9a-fA-F]',
  X: '[^0-9a-fA-F]',
}

// Chars that have no special meaning in Lua patterns but ARE special in JS
// regex - they must be escaped so JS doesn't misinterpret them.
const JS_ONLY_SPECIAL_CHARS = new Set(['|', '{', '}'])

export function translateLuaPattern(pattern: string): RegExp | null {
  if (pattern.includes('%b') || pattern.includes('%f')) {
    // Balanced-match / frontier patterns have no JS regex equivalent.
    return null
  }

  let out = ''
  let inBracket = false

  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]

    if (c === '%') {
      const next = pattern[i + 1]
      if (next === undefined) return null // dangling escape, malformed

      if (next >= '1' && next <= '9') {
        out += `\\${next}` // backreference
      } else if (CHAR_CLASSES[next]) {
        out += CHAR_CLASSES[next]
      } else if (!/[A-Za-z0-9]/.test(next)) {
        out += `\\${next}` // escaped literal magic char, e.g. %. %+ %-
      } else {
        return null // unknown %-escape, don't guess
      }
      i++
      continue
    }

    if (c === '[') {
      inBracket = true
      out += c
      continue
    }

    if (c === ']') {
      inBracket = false
      out += c
      continue
    }

    if (c === '-') {
      if (inBracket) {
        out += c // literal range char inside [...]
      } else {
        // Lazy "0 or more" quantifier in Lua - too easy to get wrong, bail.
        return null
      }
      continue
    }

    if (JS_ONLY_SPECIAL_CHARS.has(c)) {
      out += `\\${c}`
      continue
    }

    out += c
  }

  if (inBracket) return null // unterminated character set

  try {
    return new RegExp(out)
  } catch {
    return null
  }
}
