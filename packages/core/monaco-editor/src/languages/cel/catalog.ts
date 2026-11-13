// The variables a plugin CEL expression can read, as a type tree. Kong Gateway
// declares them in kong/runloop/plugin_condition.lua (DECLARATIONS) and uses
// one set for:
// - the plugin `condition` field
// - the `expressions` record (expressible fields, kong/runloop/plugin_expressions.lua)
// - `allow_when`/`deny_when` (the acl plugin, and the ai-mcp-proxy ACLs), which reject `plugins.*`
// Where the Gateway declares `dyn`, the types below are the shapes the Gateway
// fills in at runtime (for example, `principal.groups` is a list of `{ id, type }`).
// `plugins.<name>` uses the plugin name with `_` for `-`, as in `plugins.key_auth.is_matched`.
// The functions, macros and field descriptions follow the published reference:
// https://developer.konghq.com/gateway/plugins/expressions/
import { maskCelLiterals } from './tokens'

/** A string that names a Gateway or Kong Identity record, so its literals can be suggested. */
export type CelSubjectKind =
  | 'consumer-id' | 'consumer-username' | 'consumer-custom-id'
  | 'consumer-group-name' | 'consumer-group-id'
  | 'principal-id' | 'principal-group-id'

export type CelType =
  | { kind: 'string', nullable?: boolean, subject?: CelSubjectKind }
  | { kind: 'int' | 'bool' | 'dyn', nullable?: boolean }
  | { kind: 'list', of: CelType, nullable?: boolean }
  /** `metadata`: the keys come from the loaded principals. */
  | { kind: 'map', key: CelType, value: CelType, nullable?: boolean, metadata?: boolean }
  /**
   * `namespace`: a qualified-name prefix such as `http` or `net.src`. It is not a
   * value, so it has no methods, and `has()` cannot test its fields.
   */
  | { kind: 'record', fields: Record<string, CelType>, namespace?: boolean }

const STRING: CelType = { kind: 'string' }
const NULLABLE_STRING: CelType = { kind: 'string', nullable: true }
const INT: CelType = { kind: 'int' }
const DYN: CelType = { kind: 'dyn' }
const STRINGS: CelType = { kind: 'list', of: STRING, nullable: true }
const namespace = (fields: Record<string, CelType>): CelType => ({ kind: 'record', fields, namespace: true })
const stringMap = (value: CelType, nullable?: boolean): CelType => ({ kind: 'map', key: STRING, value, nullable })

const subject = (kind: CelSubjectKind, nullable?: boolean): CelType => ({ kind: 'string', subject: kind, nullable })
const subjects = (kind: CelSubjectKind): CelType => ({ kind: 'list', of: subject(kind), nullable: true })

const ENTITY = namespace({ id: NULLABLE_STRING, name: NULLABLE_STRING, tags: STRINGS })

const GLOBALS: Record<string, CelType> = {
  http: namespace({
    method: STRING, host: STRING, path: STRING,
    path_segments: { kind: 'list', of: STRING },
    headers: stringMap(NULLABLE_STRING), headers_list: stringMap(STRINGS),
    queries: stringMap(NULLABLE_STRING), queries_list: stringMap(STRINGS),
  }),
  net: namespace({
    protocol: STRING,
    tls: namespace({ sni: NULLABLE_STRING }),
    src: namespace({ ip: STRING, port: INT }),
    dst: namespace({ ip: STRING, port: INT }),
  }),
  consumer: namespace({
    id: subject('consumer-id', true), custom_id: subject('consumer-custom-id', true), username: subject('consumer-username', true), tags: STRINGS,
  }),
  consumer_group: namespace({ names: subjects('consumer-group-name'), ids: subjects('consumer-group-id') }),
  route: ENTITY,
  service: ENTITY,
  principal: namespace({
    id: subject('principal-id', true), display_name: NULLABLE_STRING, type: NULLABLE_STRING,
    metadata: { kind: 'map', key: STRING, value: DYN, nullable: true, metadata: true },
    groups: { kind: 'list', of: { kind: 'record', fields: { id: subject('principal-group-id'), type: STRING } }, nullable: true },
  }),
  kong: namespace({ ctx: namespace({ shared: stringMap(DYN) }) }),
}

const PLUGINS: CelType = stringMap({
  kind: 'record',
  fields: { is_matched: { kind: 'bool', nullable: true }, priority: { kind: 'int', nullable: true }, access_has_executed: { kind: 'bool', nullable: true } },
})

/**
 * What the docs say about each variable. `*` stands for a header, query or plugin name.
 * `principal.type` and `principal.groups` are newer than the published reference.
 * Kong Gateway reads `principal.groups` everywhere, but only AI Gateway builds
 * (kong-ee aigw-master) ask Kong Identity for them (`include_groups` in
 * kong/tools/konnect/principal/client.lua). Revisit the note when Kong Gateway does too.
 */
const DESCRIPTIONS: Record<string, string> = {
  'http.method': 'The request method.',
  'http.host': 'The Host header value.',
  'http.path': 'The normalized request path, without the query string.',
  'http.path_segments': 'The path split on `/`, without empty segments: `/a/b/c` is `["a", "b", "c"]`.',
  'http.headers': 'The first value of each request header. Header names are lowercase, with `_` for `-`: `X-My-Header` is `x_my_header`.',
  'http.headers.*': 'The first value of the header, or null when it is absent.',
  'http.headers_list': 'All values of each request header. Header names are lowercase, with `_` for `-`.',
  'http.headers_list.*': 'All values of the header, or null when it is absent.',
  'http.queries': 'The first value of each query parameter.',
  'http.queries.*': 'The first value of the query parameter, or null when it is absent.',
  'http.queries_list': 'All values of each query parameter.',
  'http.queries_list.*': 'All values of the query parameter, or null when it is absent.',
  'net.protocol': 'The protocol of the matched Route, such as `https`.',
  'net.tls.sni': 'The SNI from the TLS ClientHello. Null for a connection without TLS.',
  'net.src.ip': 'The client IP address.',
  'net.src.port': 'The client port.',
  'net.dst.ip': 'The IP address where Kong Gateway accepted the connection.',
  'net.dst.port': 'The port where Kong Gateway accepted the connection.',
  'route.id': 'The ID of the matched Route. Null when no Route matched.',
  'route.name': 'The name of the matched Route.',
  'route.tags': 'The tags of the matched Route.',
  'service.id': 'The ID of the matched Gateway Service. Null when no Service matched.',
  'service.name': 'The name of the matched Gateway Service.',
  'service.tags': 'The tags of the matched Gateway Service.',
  'consumer.id': 'The ID of the authenticated Consumer. Set only after an authentication plugin runs, so use it on a plugin with a lower priority.',
  'consumer.username': 'The username of the authenticated Consumer.',
  'consumer.custom_id': 'The custom ID of the authenticated Consumer.',
  'consumer.tags': 'The tags of the authenticated Consumer.',
  'consumer_group.names': 'The names of the matched Consumer Groups. Set only after an authentication plugin runs.',
  'consumer_group.ids': 'The IDs of the matched Consumer Groups.',
  'kong.ctx.shared': 'Values that plugins with a higher priority set in the access phase. A missing key is a runtime error, so check it with `has()` first.',
  'principal.id': 'The ID of the authenticated Principal.',
  'principal.display_name': 'The display name of the authenticated Principal.',
  'principal.type': 'The type of the authenticated Principal.',
  'principal.metadata': 'The attributes of the authenticated Principal. A missing key is a runtime error, so check it with `has()` first.',
  'principal.groups': 'The groups and teams of the authenticated Principal, including memberships through nested teams. Each has an `id` and a `type` (`group` or `team`). Only AI Gateway data planes load the groups; on other data planes the value is null.',
  'plugins.*.is_matched': 'True when the plugin is configured and its Route or Service scope matches. False when it does not match. Null when it is not configured.',
  'plugins.*.priority': 'The priority of the plugin. Null when the plugin does not match.',
  'plugins.*.access_has_executed': 'True after the plugin ran its access phase. Null when it is not configured.',
  'kong.ctx.shared.*': 'A value that a plugin with a higher priority set. Check it with `has()` first.',
  'principal.metadata.*': 'An attribute of the authenticated Principal. Check it with `has()` first.',
}

/** The docs for a global variable path, such as `consumer.id` or `plugins.key_auth.priority`. */
export const getCelDescription = (path: string): string | undefined =>
  DESCRIPTIONS[path] ?? DESCRIPTIONS[path.replace(/^(http\.(?:headers|queries)(?:_list)?|plugins|kong\.ctx\.shared|principal\.metadata)\.\w+/, '$1.*')]

export interface CelScope {
  /** `plugins.<name>.*` is available. The ACL `*_when` fields reject it. */
  pluginState: boolean
  /**
   * The field is an expressible field's expression (`expressions.*`). Its value
   * falls back to the sibling config value, so `default()` is not allowed.
   */
  expressible: boolean
}

/** ACL rules are checked outside the plugins iterator, so they cannot read plugin state. */
export const getCelScope = (path: string): CelScope => ({
  pluginState: !/(?:^|\.)(?:allow|deny)_when(?:\.|$)/.test(path),
  expressible: /^expressions(?:\.|$)/.test(path),
})

export const getCelGlobals = (scope: CelScope): Record<string, CelType> =>
  scope.pluginState ? { ...GLOBALS, plugins: PLUGINS } : GLOBALS

/** The type of `name` selected from a value of type `type`. A map key selects its value. */
export const getCelMember = (type: CelType, name: string): CelType | undefined => {
  if (type.kind === 'record') return type.fields[name]
  if (type.kind === 'map') return type.value
  if (type.kind === 'dyn') return DYN
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

export interface CelCallable {
  name: string
  /** What the function does, from the Kong Gateway reference. */
  description?: string
  signature: string
  parameters: string[]
  alternateParameters?: string[]
  insertText: string
}

const FUNCTION_DESCRIPTIONS: Record<string, string> = {
  has: 'Whether a map has the key. Use it before you read a key of `kong.ctx.shared` or `principal.metadata`.',
  matches: 'Whether the text matches the regular expression. The match is not anchored: use `^` and `$` to match the whole text.',
  size: 'The number of items in a list or map, or of characters in a string.',
  default: 'The fallback value when the expression fails at runtime.',
  contains: 'Whether the string contains the substring.',
  startsWith: 'Whether the string starts with the prefix.',
  endsWith: 'Whether the string ends with the suffix.',
  all: 'Whether the predicate is true for every item (for a map, every key).',
  exists: 'Whether the predicate is true for at least one item (for a map, one key).',
  map: 'The list of the expression for each item (for a map, each key), optionally only where the predicate is true.',
  filter: 'The items (for a map, the keys) for which the predicate is true.',
}

const call = (name: string, ...parameters: string[]): CelCallable => ({
  name, parameters, description: FUNCTION_DESCRIPTIONS[name],
  signature: `${name}(${parameters.join(', ')})`,
  insertText: `${name}(${parameters.map((_, i) => '$' + (i + 1)).join(', ')})`,
})

export const CEL_MACROS = new Set(['all', 'exists', 'map', 'filter'])

const GLOBAL_FUNCTIONS = [call('has', 'field'), call('matches', 'text', 'pattern'), call('size', 'value')]
/** `default(expression, fallback)`: the fallback when the expression fails at runtime. */
const DEFAULT = call('default', 'expression', 'fallback')
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

/** The functions to offer at the start of an expression (no type), or the methods of a value. */
export const getCelCallables = (type?: CelType, scope?: CelScope): readonly CelCallable[] => {
  if (!type) return scope?.expressible === false ? [...GLOBAL_FUNCTIONS, DEFAULT] : GLOBAL_FUNCTIONS
  if (type.kind === 'string') return STRING_METHODS
  if (type.kind === 'list') return LIST_METHODS
  if (type.kind === 'map') return MAP_METHODS
  return []
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
export const resolveCelChain = (chain: string, locals: ReadonlyMap<string, CelType>, scope: CelScope): CelType | undefined => {
  const [root, ...members] = chain.split('.')
  let type: CelType | undefined = locals.get(root) ?? getCelGlobals(scope)[root]
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
export const getCelLocals = (before: string, scope: CelScope): Map<string, CelType> => {
  const locals = new Map<string, CelType>()
  for (const frame of getCelCallFrames(before)) {
    if (!CEL_MACROS.has(frame.name) || !frame.method || !frame.binding || frame.argument < 1) continue
    const receiver = frame.receiver ? resolveCelChain(frame.receiver, locals, scope) : undefined
    locals.set(frame.binding, receiver ? getCelElement(receiver) : DYN)
  }
  return locals
}
