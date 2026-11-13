// The CEL type system, the standard functions and macros, and the call and
// macro-variable analysis that completion, hover and hints share. What an
// expression can read comes from plugins: a host picks the ones its
// expressions support (see `kong.ts` for Kong Gateway's).
import { maskCelLiterals } from './tokens'
import type { CelHint } from './hints'

export type CelType =
  /** `subject`: the kind of record the string names, so plugins can suggest its values. */
  | { kind: 'string', nullable?: boolean, subject?: string }
  | { kind: 'int' | 'bool' | 'dyn', nullable?: boolean }
  | { kind: 'list', of: CelType, nullable?: boolean }
  /**
   * `keys`: where the map's known keys come from, so plugins can suggest them.
   * `guarded`: reading a missing key is a runtime error, so check it with `has()` first.
   */
  | { kind: 'map', key: CelType, value: CelType, nullable?: boolean, keys?: string, guarded?: boolean }
  /**
   * `namespace`: a qualified-name prefix such as `http` or `net.src`. It is not a
   * value, so it has no methods, and `has()` cannot test its fields.
   */
  | { kind: 'record', fields: Record<string, CelType>, namespace?: boolean }

/** A literal value that names a record. */
export interface CelSubjectValue {
  /** The `subject` of the string the literal is compared with. */
  kind: string
  /** The literal the expression compares with. */
  value: string
  /** The record's display name. */
  name: string
  id: string
}

export interface CelCallable {
  name: string
  /** What the function does. */
  description?: string
  signature: string
  parameters: string[]
  alternateParameters?: string[]
  insertText: string
}

/**
 * One feature of a CEL dialect: the variables, functions, record values and
 * hints it adds. A host enables a feature by passing its plugin to `defineCelLanguage`.
 */
export interface CelPlugin {
  variables?: Record<string, CelType>
  /** What the docs say about a variable path. `*` stands for any map key, as in `http.headers.*`. */
  descriptions?: Record<string, string>
  functions?: readonly CelCallable[]
  /** Plural or near-miss roots people type, and the variable they mean. */
  aliases?: Record<string, string>
  /** The values a string with this `subject` can take, in list order. */
  values?: (subject: string) => readonly CelSubjectValue[]
  /** The known keys of a map with these `keys`, with the value types seen for each key. */
  keys?: (source: string) => ReadonlyArray<{ key: string, types: readonly string[] }>
  /** A hint about the expression as a whole, literals included. */
  check?: (expression: string) => CelHint | undefined
  /** A hint about a variable the expression reads: the dotted path from a global, as typed. */
  checkPath?: (path: readonly string[]) => CelHint | undefined
}

/** A CEL dialect: the plugins an editor enables, merged. */
export interface CelLanguage {
  variables: Readonly<Record<string, CelType>>
  descriptions: Readonly<Record<string, string>>
  functions: readonly CelCallable[]
  aliases: Readonly<Record<string, string>>
  plugins: readonly CelPlugin[]
  /** Standard function and method names supported by this evaluator. Omit for the full set. */
  standardCallables?: readonly string[]
}

// No prototype, so a typed name such as `constructor` is not a variable.
const merge = <T>(records: ReadonlyArray<Record<string, T> | undefined>): Record<string, T> =>
  Object.assign(Object.create(null), ...records)

export const defineCelLanguage = (plugins: readonly CelPlugin[], options: Pick<CelLanguage, 'standardCallables'> = {}): CelLanguage => ({
  ...options,
  variables: merge(plugins.map(plugin => plugin.variables)),
  descriptions: merge(plugins.map(plugin => plugin.descriptions)),
  functions: plugins.flatMap(plugin => plugin.functions ?? []),
  aliases: merge(plugins.map(plugin => plugin.aliases)),
  plugins,
})

const DYN: CelType = { kind: 'dyn' }

/** The type of `name` selected from a value of type `type`. A map key selects its value. */
export const getCelMember = (type: CelType, name: string): CelType | undefined => {
  if (type.kind === 'record') return type.fields[name]
  if (type.kind === 'map') return type.value
  if (type.kind === 'dyn') return DYN
}

/** The docs for a variable path, such as `consumer.id` or `plugins.key_auth.priority`. */
export const getCelDescription = (path: string, language: CelLanguage): string | undefined => {
  const [root, ...members] = path.split('.')
  let type: CelType | undefined = language.variables[root]
  const pattern = [root]
  for (const member of members) {
    pattern.push(type?.kind === 'map' ? '*' : member)
    type = type && getCelMember(type, member)
  }
  return language.descriptions[path] ?? language.descriptions[pattern.join('.')]
}

/** The type a macro variable takes: a list item, or a map key. */
export const getCelElement = (type: CelType): CelType => {
  if (type.kind === 'list') return type.of
  if (type.kind === 'map') return type.key
  return DYN
}

export const formatCelType = (type: CelType): string => {
  const suffix = 'nullable' in type && type.nullable ? ' | null' : ''
  if (type.kind === 'list') return `list<${formatCelType(type.of)}>${suffix}`
  if (type.kind === 'map') return `map<${formatCelType(type.key)}, ${formatCelType(type.value)}>${suffix}`
  if (type.kind === 'record') return type.namespace ? 'namespace' : `{ ${Object.keys(type.fields).join(', ')} }`
  return type.kind + suffix
}

const containsMap = (type: CelType): boolean =>
  type.kind === 'map' || (type.kind === 'record' && Object.values(type.fields).some(containsMap))

/**
 * The fields to offer after `type.`. `presenceOnly` is for `has()`: CEL can only
 * test a field of a map or of a value, so namespaces offer only the paths to a map.
 */
export const getCelFields = (type: CelType, presenceOnly = false): Array<[string, CelType]> => {
  if (type.kind !== 'record') return []
  const fields = Object.entries(type.fields)
  return presenceOnly && type.namespace ? fields.filter(([, field]) => containsMap(field)) : fields
}

/** Whether `has()` can start from a variable of this type. */
export const isCelPresenceRoot = (type: CelType) => containsMap(type) || (type.kind === 'record' && !type.namespace)

/** A function or method to offer, with a snippet that fills in its parameters. */
export const celFunction = (name: string, parameters: string[], description?: string): CelCallable => ({
  name, parameters, description,
  signature: `${name}(${parameters.join(', ')})`,
  insertText: `${name}(${parameters.map((_, i) => '$' + (i + 1)).join(', ')})`,
})

const FUNCTION_DESCRIPTIONS: Record<string, string> = {
  has: 'Whether a map has the key. Use it before you read a key that may be missing.',
  matches: 'Whether the text matches the regular expression. The match is not anchored: use `^` and `$` to match the whole text.',
  size: 'The number of items in a list or map, or of characters in a string.',
  contains: 'Whether the string contains the substring.',
  startsWith: 'Whether the string starts with the prefix.',
  endsWith: 'Whether the string ends with the suffix.',
  all: 'Whether the predicate is true for every item (for a map, every key).',
  exists: 'Whether the predicate is true for at least one item (for a map, one key).',
  map: 'The list of the expression for each item (for a map, each key), optionally only where the predicate is true.',
  filter: 'The items (for a map, the keys) for which the predicate is true.',
}

const call = (name: string, ...parameters: string[]) => celFunction(name, parameters, FUNCTION_DESCRIPTIONS[name])

export const CEL_MACROS = new Set(['all', 'exists', 'map', 'filter'])

export const isCelMacroEnabled = (name: string, language: CelLanguage) =>
  CEL_MACROS.has(name) && (!language.standardCallables || language.standardCallables.includes(name))

const GLOBAL_FUNCTIONS = [call('has', 'field'), call('matches', 'text', 'pattern'), call('size', 'value')]
// CEL macros range over list items, or over the keys of a map.
const collectionMethods = (item: string) => [
  call('all', item, 'predicate'), call('exists', item, 'predicate'),
  { ...call('map', item, 'expression'), alternateParameters: [item, 'predicate', 'expression'] },
  call('filter', item, 'predicate'), call('size'),
]
const LIST_METHODS = collectionMethods('item')
const MAP_METHODS = collectionMethods('key')
const STRING_METHODS = [
  call('contains', 'substring'), call('startsWith', 'prefix'), call('endsWith', 'suffix'), call('matches', 'pattern'), call('size'),
]

const METHODS: Partial<Record<CelType['kind'], readonly CelCallable[]>> = {
  list: LIST_METHODS, map: MAP_METHODS, string: STRING_METHODS,
}

/** The functions to offer at the start of an expression (no type), or the methods of a value. */
export const getCelCallables = (type?: CelType, language?: CelLanguage): readonly CelCallable[] => {
  const standard = type ? METHODS[type.kind] ?? [] : GLOBAL_FUNCTIONS
  const allowed = language?.standardCallables
  const callables = allowed ? standard.filter(callable => allowed.includes(callable.name)) : standard
  return !type && language?.functions.length ? [...callables, ...language.functions] : callables
}

export interface CelCallFrame {
  /** The function name, empty for a bracket or a parenthesized group. */
  name: string
  receiver: string
  /** Called as a method (`x.name(…)`), even when the receiver is not a plain name, as in `a[k].exists(…)`. */
  method: boolean
  argument: number
  /** Offset of the opening bracket. */
  start: number
  /** The first argument when it is a plain identifier: a macro's variable. */
  binding?: string
}

/** The brackets still open at the end of `before`, outermost first. */
export const getCelCallFrames = (before: string): CelCallFrame[] => {
  const code = maskCelLiterals(before)
  const stack: CelCallFrame[] = []
  for (let index = 0; index < code.length; index++) {
    if ('([{'.includes(code[index])) {
      const before = code.slice(0, index)
      const name = code[index] === '(' ? before.match(/(?:(\b[a-zA-Z_]\w*(?:\s*\.\s*[a-zA-Z_]\w*)*)\s*\.\s*)?([a-zA-Z_]\w*)\s*$/) : null
      stack.push({
        name: name?.[2] ?? '',
        receiver: name?.[1]?.replace(/\s+/g, '') ?? '',
        method: !!name && /\.\s*[a-zA-Z_]\w*\s*$/.test(before),
        argument: 0,
        start: index,
      })
    } else if (')]}'.includes(code[index])) {
      stack.pop()
    } else if (code[index] === ',' && stack.length) {
      const frame = stack[stack.length - 1]
      if (frame.argument === 0) {
        const binding = code.slice(frame.start + 1, index).trim()
        if (/^[a-zA-Z_]\w*$/.test(binding)) frame.binding = binding
      }
      frame.argument++
    }
  }
  return stack
}

/** The type of a dotted chain such as `principal.groups` or `g.id`, or undefined when it names nothing. */
export const resolveCelChain = (chain: string, locals: ReadonlyMap<string, CelType>, language: CelLanguage): CelType | undefined => {
  const [root, ...members] = chain.split('.')
  let type: CelType | undefined = locals.get(root) ?? language.variables[root]
  for (const member of members) {
    if (!type) return
    type = getCelMember(type, member)
  }
  return type
}

/**
 * The macro variables in scope at the end of `before`, with their types. A
 * variable is in scope after its macro's first argument, and it hides a global
 * of the same name: in `http.headers.map(service, …)`, `service` is a header name.
 */
export const getCelLocals = (before: string, language: CelLanguage): Map<string, CelType> => {
  const locals = new Map<string, CelType>()
  for (const frame of getCelCallFrames(before)) {
    if (!isCelMacroEnabled(frame.name, language) || !frame.method || !frame.binding || frame.argument < 1) continue
    const receiver = frame.receiver ? resolveCelChain(frame.receiver, locals, language) : undefined
    locals.set(frame.binding, receiver ? getCelElement(receiver) : DYN)
  }
  return locals
}
