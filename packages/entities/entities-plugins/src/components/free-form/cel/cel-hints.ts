import { formatCelType, getCelGlobals, getCelLocals, getCelMember } from './cel-catalog'
import type { CelScope, CelType } from './cel-catalog'
import { maskCelLiterals } from './cel-tokens'

// Plural or near-miss roots people type for the Gateway variables.
const ALIASES: Record<string, string> = {
  consumers: 'consumer', consumer_groups: 'consumer_group', principals: 'principal',
  routes: 'route', services: 'service', request: 'http', headers: 'http.headers', plugin: 'plugins',
}

export type CelHint =
  | { kind: 'alias', typed: string, expected: string }
  | { kind: 'unknown-field', field: string }
  | { kind: 'unknown-member', field: string, base: string, type: string }
  | { kind: 'plugin-state' }
  | { kind: 'header-name', typed: string, expected: string }
  | { kind: 'unguarded', field: string }
  | { kind: 'default' }
  | { kind: 'assignment' }

// Reading a missing key of these maps is a runtime error, so the docs ask for `has()` first.
const GUARDED_MAPS = ['kong.ctx.shared', 'principal.metadata']
const HEADER_MAP = /^http\.headers(?:_list)?$/
// Bracket access keeps the literal, which dot access cannot hold: http.headers["X-Tenant"].
const HEADER_INDEX = /(?<![\w.])http\s*\.\s*headers(?:_list)?\s*\[\s*(["'])((?:\\.|(?!\1)[^\\])*)\1\s*\]/g
const headerName = (name: string) => name.toLowerCase().replace(/-/g, '_')

/**
 * A hint about a variable or field the Gateway does not supply. This is not CEL
 * validation: Kong checks the expression when the plugin is saved. The hint
 * catches what would otherwise fail only on save, or on the data plane.
 */
export const getCelHint = (expression: string, scope: CelScope): CelHint | undefined => {
  const code = maskCelLiterals(expression)
  // CEL compares with `==`; a single `=` is not an operator.
  if (/(?<![=!<>])=(?!=)/.test(code)) return { kind: 'assignment' }
  // An expressible field falls back to its config value, so the Gateway rejects default() there.
  if (scope.expressible && /^\s*default\s*\(/.test(code)) return { kind: 'default' }
  for (const [, , name] of expression.matchAll(HEADER_INDEX)) {
    if (name !== headerName(name)) return { kind: 'header-name', typed: name, expected: headerName(name) }
  }
  const guarded = new Set([...code.matchAll(/\bhas\s*\(\s*([A-Za-z_]\w*(?:\s*\.\s*\w+)*)\s*\)/g)].map(([, chain]) => chain.replace(/\s+/g, '')))
  const allGlobals = getCelGlobals({ ...scope, pluginState: true })
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

    const locals = getCelLocals(before, scope)
    let type: CelType | undefined = locals.get(root)
    if (!type) {
      if (!(root in allGlobals)) {
        if (root in ALIASES) return { kind: 'alias', typed: root, expected: ALIASES[root] }
        continue
      }
      if (root === 'plugins' && !scope.pluginState) return { kind: 'plugin-state' }
      type = allGlobals[root]
    }

    for (let index = 1; index < segments.length; index++) {
      const member = getCelMember(type, segments[index])
      const field = segments.slice(0, index + 1).join('.')
      if (!member) {
        if (!locals.has(root)) return { kind: 'unknown-field', field }
        return { kind: 'unknown-member', field, base: segments.slice(0, index).join('.'), type: formatCelType(type) }
      }
      if (!locals.has(root)) {
        const map = segments.slice(0, index).join('.')
        if (HEADER_MAP.test(map) && segments[index] !== headerName(segments[index])) {
          return { kind: 'header-name', typed: segments[index], expected: headerName(segments[index]) }
        }
        if (GUARDED_MAPS.includes(map) && !/\bhas\s*\(\s*$/.test(before) && !guarded.has(field)) return { kind: 'unguarded', field }
      }
      type = member
    }
  }
}
