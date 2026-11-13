import { formatCelType, getCelLocals, getCelMember } from './catalog'
import type { CelLanguage, CelType } from './catalog'
import { maskCelLiterals } from './tokens'

/**
 * A hint for the host to word: a `kind`, with the values its message needs. The
 * core kinds are `assignment`, `alias` (`typed`, `expected`), `unknown-field`
 * (`field`), `unknown-member` (`field`, `base`, `type`) and `unguarded`
 * (`field`); plugins add their own.
 */
export interface CelHint {
  kind: string
  [value: string]: string
}

/**
 * A hint about a variable or field the dialect does not supply. This is not CEL
 * validation: the server checks the expression when it is saved. The hint
 * catches what would otherwise fail only on save, or at runtime.
 */
export const getCelHint = (expression: string, language: CelLanguage): CelHint | undefined => {
  const code = maskCelLiterals(expression)
  // CEL compares with `==`; a single `=` is not an operator.
  if (/(?<![=!<>])=(?!=)/.test(code)) return { kind: 'assignment' }
  for (const plugin of language.plugins) {
    const hint = plugin.check?.(expression)
    if (hint) return hint
  }
  const guarded = new Set([...code.matchAll(/\bhas\s*\(\s*([A-Za-z_]\w*(?:\s*\.\s*\w+)*)\s*\)/g)].map(([, chain]) => chain.replace(/\s+/g, '')))
  // A dotted chain that is not itself a member of something else.
  for (const match of code.matchAll(/(?<![\w.])[A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*/g)) {
    const before = code.slice(0, match.index)
    const after = code.slice(match.index + match[0].length)
    const segments = match[0].split('.').map(segment => segment.trim())
    // A trailing segment followed by `(` is a method, not a field.
    if (/^\s*\(/.test(after)) segments.pop()
    const [root] = segments
    if (!root) continue
    if (segments.length === 1) {
      // A map literal key or a ternary branch, not a variable.
      if (/^\s*:/.test(after)) continue
      // A macro's first argument names a new variable.
      if (/\.\s*\w+\s*\(\s*$/.test(before) && /^\s*,/.test(after)) continue
    }

    const local = getCelLocals(before, language).get(root)
    if (!local) {
      for (const plugin of language.plugins) {
        const hint = plugin.checkPath?.(segments)
        if (hint) return hint
      }
      if (!language.variables[root]) {
        if (language.aliases[root]) return { kind: 'alias', typed: root, expected: language.aliases[root] }
        continue
      }
    }

    let type: CelType = local ?? language.variables[root]
    for (let index = 1; index < segments.length; index++) {
      const member = getCelMember(type, segments[index])
      const field = segments.slice(0, index + 1).join('.')
      if (!member) {
        if (!local) return { kind: 'unknown-field', field }
        return { kind: 'unknown-member', field, base: segments.slice(0, index).join('.'), type: formatCelType(type) }
      }
      if (!local && type.kind === 'map' && type.guarded && !/\bhas\s*\(\s*$/.test(before) && !guarded.has(field)) return { kind: 'unguarded', field }
      type = member
    }
  }
}
