import { formatCelType, getCelLocals, getCelMember } from './catalog'
import type { CelKind, CelType } from './catalog'
import { CEL_ASSIGNMENT, maskCelLiterals } from './tokens'

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

/** Offsets are UTF-16 offsets into the original expression, with an exclusive end. */
export interface CelDiagnostic {
  hint: CelHint
  range?: { start: number, end: number }
}

/**
 * A hint about a variable or field the kind does not supply. This is not CEL
 * validation: the server checks the expression when it is saved. The hint
 * catches what would otherwise fail only on save, or at runtime.
 */
export function* getCelDiagnostics(expression: string, kind: CelKind): Generator<CelDiagnostic> {
  const code = maskCelLiterals(expression)
  // CEL compares with `==`; a single `=` is not an operator.
  for (const { index } of code.matchAll(CEL_ASSIGNMENT)) {
    yield { hint: { kind: 'assignment' }, range: { start: index, end: index + 1 } }
  }
  for (const plugin of kind.plugins) {
    if (plugin.checkRanges) {
      yield* plugin.checkRanges(expression, code)
    } else {
      const hint = plugin.check?.(expression)
      if (hint) yield { hint }
    }
  }
  const guarded = new Set([...code.matchAll(/\bhas\s*\(\s*([A-Za-z_]\w*(?:\s*\.\s*\w+)*)\s*\)/g)].map(([, chain]) => chain.replace(/\s+/g, '')))
  // A dotted chain that is not itself a member of something else.
  paths: for (const match of code.matchAll(/(?<![\w.])[A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*/g)) {
    const before = code.slice(0, match.index)
    const after = code.slice(match.index + match[0].length)
    const words = [...match[0].matchAll(/[A-Za-z_]\w*/g)]
    const segments = words.map(word => word[0])
    const rangeOf = (index: number) => {
      const word = words[index]
      const start = match.index + word.index
      return { start, end: start + word[0].length }
    }
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

    const local = getCelLocals(before, kind).get(root)
    if (!local) {
      for (const plugin of kind.plugins) {
        const hint = plugin.checkPath?.(segments)
        if (hint) {
          const keyIndex = segments.indexOf(hint.typed)
          const range = keyIndex >= 0 ? rangeOf(keyIndex) : { start: match.index, end: rangeOf(segments.length - 1).end }
          yield { hint, range }
          continue paths
        }
      }
      if (!kind.variables[root]) {
        if (kind.aliases[root]) yield { hint: { kind: 'alias', typed: root, expected: kind.aliases[root] }, range: rangeOf(0) }
        continue
      }
    }

    let type: CelType = local ?? kind.variables[root]
    for (let index = 1; index < segments.length; index++) {
      const member = getCelMember(type, segments[index])
      const field = segments.slice(0, index + 1).join('.')
      if (!member) {
        const hint: CelHint = local
          ? { kind: 'unknown-member', field, base: segments.slice(0, index).join('.'), type: formatCelType(type) }
          : { kind: 'unknown-field', field }
        yield { hint, range: rangeOf(index) }
        break
      }
      if (!local && type.kind === 'map' && type.guarded && !/\bhas\s*\(\s*$/.test(before) && !guarded.has(field)) {
        yield { hint: { kind: 'unguarded', field }, range: rangeOf(index) }
      }
      type = member
    }
  }
}

/** First hint in priority order, for hosts that present a single message. */
export const getCelHint = (expression: string, kind: CelKind): CelHint | undefined =>
  getCelDiagnostics(expression, kind).next().value?.hint
