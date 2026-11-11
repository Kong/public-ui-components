import { getCelElement, getCelLocals, resolveCelChain } from './cel-catalog'
import type { CelScope, CelSubjectKind, CelType } from './cel-catalog'
import { CEL_LITERALS_AND_COMMENTS } from './cel-tokens'
import type { CelIdentitySubjects } from '../../../types'

/**
 * Records that plugin CEL expressions can name. The form loads Consumers and
 * Consumer Groups; the host app supplies Kong Identity records. A list the user
 * cannot read stays empty.
 */
export interface CelSubjects extends CelIdentitySubjects {
  consumers?: ReadonlyArray<{ id: string, username?: string | null, custom_id?: string | null }>
  consumerGroups?: ReadonlyArray<{ id: string, name: string }>
}

/** A literal value that names a record. */
export interface CelSubjectValue {
  kind: CelSubjectKind
  /** The literal the expression compares with. */
  value: string
  /** The record's display name. */
  name: string
  id: string
}

/** The values a subject kind can take, in list order. */
export const getCelSubjectValues = (subjects: CelSubjects, kind: CelSubjectKind): CelSubjectValue[] => {
  const values: CelSubjectValue[] = []
  const add = (value: string | null | undefined, name: string | null | undefined, id: string) => {
    if (value) values.push({ kind, value, name: name || id, id })
  }
  for (const { id, username, custom_id } of kind.startsWith('consumer-') && !kind.startsWith('consumer-group') ? subjects.consumers ?? [] : []) {
    const name = username || custom_id
    if (kind === 'consumer-id') add(id, name, id)
    if (kind === 'consumer-username') add(username, name, id)
    if (kind === 'consumer-custom-id') add(custom_id, name, id)
  }
  for (const { id, name } of kind.startsWith('consumer-group') ? subjects.consumerGroups ?? [] : []) {
    add(kind === 'consumer-group-name' ? name : id, name, id)
  }
  if (kind === 'principal-id') for (const { id, display_name } of subjects.principals ?? []) add(id, display_name, id)
  if (kind === 'principal-group-id') for (const { id, name } of subjects.principalGroups ?? []) add(id, name, id)
  return values
}

// Keys that CEL can select with a dot: identifiers that are not reserved words.
const CEL_RESERVED = new Set(['as', 'break', 'const', 'continue', 'else', 'false', 'for', 'function', 'if', 'import', 'in', 'let', 'loop', 'namespace', 'null', 'package', 'return', 'true', 'var', 'void', 'while'])
const valueType = (value: unknown) => Array.isArray(value) ? 'list' : value === null ? 'null' : typeof value

/** The `principal.metadata` keys that loaded principals use, with the value types seen for each key. */
export const getCelMetadataKeys = (subjects: CelSubjects) => {
  const keys = new Map<string, Set<string>>()
  for (const { metadata } of subjects.principals ?? []) {
    for (const [key, value] of Object.entries(metadata ?? {})) {
      if (/^[A-Za-z_]\w*$/.test(key) && !CEL_RESERVED.has(key)) keys.set(key, (keys.get(key) ?? new Set()).add(valueType(value)))
    }
  }
  return [...keys].sort(([a], [b]) => a.localeCompare(b)).map(([key, types]) => ({ key, types: [...types] }))
}

const CHAIN = '([A-Za-z_]\\w*(?:\\s*\\.\\s*[A-Za-z_]\\w*)*)'
// The chain must end there: not a method call, a deeper member or an index.
const CHAIN_END = '(?!\\s*[.(\\[\\w])'
const COMPARED_BEFORE = new RegExp(`(?<![\\w.])${CHAIN}\\s*[=!]=\\s*$`)
// A single `=`, which CEL does not have: people type it for `==`.
const ASSIGNED_BEFORE = new RegExp(`(?<![\\w.])${CHAIN}\\s*=\\s*$`)
const COMPARED_AFTER = new RegExp(`^\\s*[=!]=\\s*${CHAIN}${CHAIN_END}`)
const MEMBER_OF = new RegExp(`^\\s*in\\s+${CHAIN}${CHAIN_END}`)

const subjectOf = (type: CelType | undefined) => type?.kind === 'string' ? type.subject : undefined

/**
 * The record kind that a value at `start..end` is compared with: the other side
 * of `==`/`!=`, or the list after `in`. Macro variables count, so the literal in
 * `principal.groups.exists(g, g.id == "…")` names a principal group.
 */
export const getCelComparedSubject = (source: string, start: number, end: number, scope: CelScope): CelSubjectKind | undefined =>
  compared(source, start, end, scope)?.kind

/** As `getCelComparedSubject`, plus where a single `=` starts, to replace it with `==`. */
const compared = (source: string, start: number, end: number, scope: CelScope): { kind?: CelSubjectKind, assignAt?: number } | undefined => {
  const before = source.slice(0, start)
  const after = source.slice(end)
  const locals = getCelLocals(before, scope)
  const resolve = (chain: string) => resolveCelChain(chain.replace(/\s+/g, ''), locals, scope)
  const left = before.match(COMPARED_BEFORE)?.[1]
  if (left) return { kind: subjectOf(resolve(left)) }
  const assigned = before.match(ASSIGNED_BEFORE)?.[1]
  if (assigned) return { kind: subjectOf(resolve(assigned)), assignAt: before.lastIndexOf('=') }
  const right = after.match(COMPARED_AFTER)?.[1]
  if (right) return { kind: subjectOf(resolve(right)) }
  const list = after.match(MEMBER_OF)?.[1]
  const listType = list ? resolve(list) : undefined
  if (listType) return { kind: subjectOf(getCelElement(listType)) }
}

/** The string literal that contains `offset`, with its quote and decoded value. */
const literalAt = (source: string, offset: number) => {
  for (const token of source.matchAll(CEL_LITERALS_AND_COMMENTS)) {
    const end = token.index + token[0].length
    if (offset <= token.index) break
    if (offset > end) continue
    const text = token[0]
    const quote = text[0]
    // Only plain one-line strings; not comments, raw, byte or triple-quoted strings.
    if (!'"\''.includes(quote) || text.startsWith(quote.repeat(3)) || text.includes('\n')) return
    const closed = text.length > 1 && text.endsWith(quote) && !text.endsWith('\\' + quote)
    // The cursor right after a closing quote is outside the literal.
    if (closed && offset === end) return
    return { start: token.index, end, quote, closed, body: text.slice(1, closed ? -1 : undefined) }
  }
}

/** Decodes a literal body with the escapes CEL shares with JSON. */
const decode = (body: string, quote: string) => {
  const json = body.replace(/\\.|"/g, (char) => {
    if (char === "\\'") return "'"
    if (char === '"') return quote === '"' ? char : '\\"'
    return char
  })
  try {
    return JSON.parse('"' + json + '"') as string
  } catch {
    return undefined
  }
}

const quoteAs = (value: string, quote: string) =>
  quote === "'" ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : JSON.stringify(value)

export interface CelSubjectSuggestion {
  label: string
  detail: string
  insertText: string
  /** Text Monaco filters on: what the user typed, including the quote. */
  filterText: string
  /** The source range to replace. */
  start: number
  end: number
}

/**
 * Values to suggest at `offset`: inside a string literal compared with a record
 * variable, or where that literal would start, after `consumer.username == `.
 * After a single `=` (`consumer.id = `), a value also corrects it to `==`.
 * `inLiteral` is true when the cursor is in a literal, where nothing else applies.
 */
export const getCelSubjectSuggestions = (source: string, offset: number, scope: CelScope, subjects: CelSubjects) => {
  const literal = literalAt(source, offset)
  let start = offset
  let end = offset
  let quote = '"'
  let typed = ''
  if (literal) {
    ;({ start, end, quote } = literal)
    typed = source.slice(start + 1, offset)
  } else {
    // A value typed without quotes yet, as in `consumer.username == al`.
    const word = source.slice(0, offset).match(/[\w-]*$/)![0]
    start = offset - word.length
    end = offset + (source.slice(offset).match(/^[\w-]*/)![0].length)
    typed = word
  }
  const { kind, assignAt } = compared(source, start, end, scope) ?? {}
  // Replace from the `=` on, so the operator becomes `==`; Monaco filters on all the text it replaces.
  const from = assignAt ?? start
  const typedBefore = source.slice(from, offset - typed.length)
  const suggestions: CelSubjectSuggestion[] = []
  for (const { value, name, id } of kind ? getCelSubjectValues(subjects, kind) : []) {
    // A value can be found by typing any part of its name or of the value itself.
    const match = [name, value].find(candidate => candidate.toLowerCase().includes(typed.toLowerCase()))
    if (match === undefined) continue
    suggestions.push({
      label: name,
      detail: name === value ? id : `${value}`,
      insertText: (assignAt === undefined ? '' : '== ') + quoteAs(value, quote),
      filterText: typedBefore + match,
      start: from, end,
    })
  }
  return { suggestions, inLiteral: !!literal }
}

/** The record a hovered string literal names, if it is compared with a record variable. */
export const getCelHoveredSubject = (source: string, offset: number, scope: CelScope, subjects: CelSubjects) => {
  const literal = literalAt(source, offset)
  if (!literal?.closed) return
  const kind = getCelComparedSubject(source, literal.start, literal.end, scope)
  const value = kind && decode(literal.body, literal.quote)
  const match = value === undefined ? undefined : getCelSubjectValues(subjects, kind!).find(item => item.value === value)
  if (match) return { subject: match, start: literal.start, end: literal.end }
}
