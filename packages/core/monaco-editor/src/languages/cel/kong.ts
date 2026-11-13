// Kong Gateway's CEL dialect for plugin expressions, one plugin per feature, so
// a host enables only what its expressions can read. Kong Gateway declares the
// variables in kong/runloop/plugin_condition.lua (DECLARATIONS) and uses one set for:
// - the plugin `condition` field
// - the `expressions` record (expressible fields, kong/runloop/plugin_expressions.lua)
// - `allow_when`/`deny_when` (the acl plugin, and the ai-mcp-proxy ACLs), which reject `plugins.*`
// Where the Gateway declares `dyn`, the types below are the shapes the Gateway
// fills in at runtime (for example, `principal.groups` is a list of `{ id, type }`).
// `plugins.<name>` uses the plugin name with `_` for `-`, as in `plugins.key_auth.is_matched`.
// The descriptions follow the published reference:
// https://developer.konghq.com/gateway/plugins/expressions/
import { celFunction } from './catalog'
import type { CelPlugin, CelSubjectValue, CelType } from './catalog'
import { maskCelLiterals } from './tokens'

/**
 * Records that Kong CEL expressions can name: Gateway Consumers and Consumer
 * Groups, and Kong Identity principals and groups. A list the user cannot read
 * stays empty.
 */
export interface CelSubjects {
  consumers?: ReadonlyArray<{ id: string, username?: string | null, custom_id?: string | null }>
  consumerGroups?: ReadonlyArray<{ id: string, name: string }>
  principals?: ReadonlyArray<{ id: string, display_name?: string | null, metadata?: Readonly<Record<string, unknown>> | null }>
  principalGroups?: ReadonlyArray<{ id: string, name: string }>
}

/** Reads the loaded records when the editor needs them. Without it, a plugin suggests no values. */
type Records = () => CelSubjects
const NO_RECORDS: Records = () => ({})

const STRING: CelType = { kind: 'string' }
const NULLABLE_STRING: CelType = { kind: 'string', nullable: true }
const INT: CelType = { kind: 'int' }
const DYN: CelType = { kind: 'dyn' }
const STRINGS: CelType = { kind: 'list', of: STRING, nullable: true }
const namespace = (fields: Record<string, CelType>): CelType => ({ kind: 'record', fields, namespace: true })
const stringMap = (value: CelType): CelType => ({ kind: 'map', key: STRING, value })
const subject = (kind: string, nullable?: boolean): CelType => ({ kind: 'string', subject: kind, nullable })
const subjects = (kind: string): CelType => ({ kind: 'list', of: subject(kind), nullable: true })
const ENTITY = namespace({ id: NULLABLE_STRING, name: NULLABLE_STRING, tags: STRINGS })

const subjectValue = (kind: string, value: string | null | undefined, name: string | null | undefined, id: string): CelSubjectValue[] =>
  value ? [{ kind, value, name: name || id, id }] : []

// Bracket access keeps the literal, which dot access cannot hold: http.headers["X-Tenant"].
const HEADER_INDEX = /(?<![\w.])http\s*\.\s*headers(?:_list)?\s*\[\s*(["'])((?:\\.|(?!\1)[^\\])*)\1\s*\]/g
const headerName = (name: string) => name.toLowerCase().replace(/-/g, '_')

/** The request: method, host, path, headers and query. Hints at header names that are not lowercase with `_` for `-`. */
export const kongHttp = (): CelPlugin => ({
  variables: {
    http: namespace({
      method: STRING, host: STRING, path: STRING,
      path_segments: { kind: 'list', of: STRING },
      headers: stringMap(NULLABLE_STRING), headers_list: stringMap(STRINGS),
      queries: stringMap(NULLABLE_STRING), queries_list: stringMap(STRINGS),
    }),
  },
  descriptions: {
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
  },
  aliases: { request: 'http', headers: 'http.headers' },
  check: (expression) => {
    for (const [, , name] of expression.matchAll(HEADER_INDEX)) {
      if (name !== headerName(name)) return { kind: 'header-name', typed: name, expected: headerName(name) }
    }
  },
  checkPath: ([root, map, key]) => {
    if (root === 'http' && key !== undefined && /^headers(?:_list)?$/.test(map) && key !== headerName(key)) {
      return { kind: 'header-name', typed: key, expected: headerName(key) }
    }
  },
})

/** The connection: protocol, TLS SNI, and the client and server addresses. */
export const kongNet = (): CelPlugin => ({
  variables: {
    net: namespace({
      protocol: STRING,
      tls: namespace({ sni: NULLABLE_STRING }),
      src: namespace({ ip: STRING, port: INT }),
      dst: namespace({ ip: STRING, port: INT }),
    }),
  },
  descriptions: {
    'net.protocol': 'The protocol of the matched Route, such as `https`.',
    'net.tls.sni': 'The SNI from the TLS ClientHello. Null for a connection without TLS.',
    'net.src.ip': 'The client IP address.',
    'net.src.port': 'The client port.',
    'net.dst.ip': 'The IP address where Kong Gateway accepted the connection.',
    'net.dst.port': 'The port where Kong Gateway accepted the connection.',
  },
})

/** The matched Route. */
export const kongRoute = (): CelPlugin => ({
  variables: { route: ENTITY },
  descriptions: {
    'route.id': 'The ID of the matched Route. Null when no Route matched.',
    'route.name': 'The name of the matched Route.',
    'route.tags': 'The tags of the matched Route.',
  },
  aliases: { routes: 'route' },
})

/** The matched Gateway Service. */
export const kongService = (): CelPlugin => ({
  variables: { service: ENTITY },
  descriptions: {
    'service.id': 'The ID of the matched Gateway Service. Null when no Service matched.',
    'service.name': 'The name of the matched Gateway Service.',
    'service.tags': 'The tags of the matched Gateway Service.',
  },
  aliases: { services: 'service' },
})

const CONSUMER_FIELDS: Record<string, 'id' | 'username' | 'custom_id'> = {
  'consumer-id': 'id', 'consumer-username': 'username', 'consumer-custom-id': 'custom_id',
}

/** The authenticated Consumer. Suggests the values of the loaded `consumers`. */
export const kongConsumer = (records = NO_RECORDS): CelPlugin => ({
  variables: {
    consumer: namespace({
      id: subject('consumer-id', true), custom_id: subject('consumer-custom-id', true), username: subject('consumer-username', true), tags: STRINGS,
    }),
  },
  descriptions: {
    'consumer.id': 'The ID of the authenticated Consumer. Set only after an authentication plugin runs, so use it on a plugin with a lower priority.',
    'consumer.username': 'The username of the authenticated Consumer.',
    'consumer.custom_id': 'The custom ID of the authenticated Consumer.',
    'consumer.tags': 'The tags of the authenticated Consumer.',
  },
  aliases: { consumers: 'consumer' },
  values: (kind) => {
    const field = CONSUMER_FIELDS[kind]
    if (!field) return []
    return (records().consumers ?? []).flatMap(consumer => subjectValue(kind, consumer[field], consumer.username || consumer.custom_id, consumer.id))
  },
})

/** The Consumer Groups of the authenticated Consumer. Suggests the loaded `consumerGroups`. */
export const kongConsumerGroup = (records = NO_RECORDS): CelPlugin => ({
  variables: { consumer_group: namespace({ names: subjects('consumer-group-name'), ids: subjects('consumer-group-id') }) },
  descriptions: {
    'consumer_group.names': 'The names of the matched Consumer Groups. Set only after an authentication plugin runs.',
    'consumer_group.ids': 'The IDs of the matched Consumer Groups.',
  },
  aliases: { consumer_groups: 'consumer_group' },
  values: (kind) => {
    if (kind !== 'consumer-group-name' && kind !== 'consumer-group-id') return []
    return (records().consumerGroups ?? []).flatMap(({ id, name }) => subjectValue(kind, kind === 'consumer-group-name' ? name : id, name, id))
  },
})

const valueType = (value: unknown) => Array.isArray(value) ? 'list' : value === null ? 'null' : typeof value

/**
 * The authenticated Kong Identity principal. Suggests the loaded `principals`
 * and `principalGroups`, and the `principal.metadata` keys they use.
 */
export const kongPrincipal = (records = NO_RECORDS): CelPlugin => ({
  variables: {
    principal: namespace({
      id: subject('principal-id', true), display_name: NULLABLE_STRING, type: NULLABLE_STRING,
      metadata: { kind: 'map', key: STRING, value: DYN, nullable: true, keys: 'principal.metadata', guarded: true },
      groups: { kind: 'list', of: { kind: 'record', fields: { id: subject('principal-group-id'), type: STRING } }, nullable: true },
    }),
  },
  // `principal.type` and `principal.groups` are newer than the published reference.
  // Kong Gateway reads `principal.groups` everywhere, but only AI Gateway builds
  // (kong-ee aigw-master) ask Kong Identity for them (`include_groups` in
  // kong/tools/konnect/principal/client.lua). Revisit the note when Kong Gateway does too.
  descriptions: {
    'principal.id': 'The ID of the authenticated Principal.',
    'principal.display_name': 'The display name of the authenticated Principal.',
    'principal.type': 'The type of the authenticated Principal.',
    'principal.metadata': 'The attributes of the authenticated Principal. A missing key is a runtime error, so check it with `has()` first.',
    'principal.metadata.*': 'An attribute of the authenticated Principal. Check it with `has()` first.',
    'principal.groups': 'The groups and teams of the authenticated Principal, including memberships through nested teams. Each has an `id` and a `type` (`group` or `team`). Only AI Gateway data planes load the groups; on other data planes the value is null.',
  },
  aliases: { principals: 'principal' },
  values: (kind) => {
    if (kind === 'principal-id') return (records().principals ?? []).flatMap(({ id, display_name }) => subjectValue(kind, id, display_name, id))
    if (kind === 'principal-group-id') return (records().principalGroups ?? []).flatMap(({ id, name }) => subjectValue(kind, id, name, id))
    return []
  },
  keys: (source) => {
    if (source !== 'principal.metadata') return []
    const keys = new Map<string, Set<string>>()
    for (const { metadata } of records().principals ?? []) {
      for (const [key, value] of Object.entries(metadata ?? {})) keys.set(key, (keys.get(key) ?? new Set()).add(valueType(value)))
    }
    return [...keys].map(([key, types]) => ({ key, types: [...types] }))
  },
})

/** `kong.ctx.shared`: values that plugins with a higher priority set. */
export const kongContext = (): CelPlugin => ({
  variables: { kong: namespace({ ctx: namespace({ shared: { kind: 'map', key: STRING, value: DYN, guarded: true } }) }) },
  descriptions: {
    'kong.ctx.shared': 'Values that plugins with a higher priority set in the access phase. A missing key is a runtime error, so check it with `has()` first.',
    'kong.ctx.shared.*': 'A value that a plugin with a higher priority set. Check it with `has()` first.',
  },
})

/** `plugins.<name>.*`: whether other plugins matched and ran. Not for ACL rules: see `kongAclRule`. */
export const kongPluginState = (): CelPlugin => ({
  variables: {
    plugins: stringMap({
      kind: 'record',
      fields: { is_matched: { kind: 'bool', nullable: true }, priority: { kind: 'int', nullable: true }, access_has_executed: { kind: 'bool', nullable: true } },
    }),
  },
  descriptions: {
    'plugins.*.is_matched': 'True when the plugin is configured and its Route or Service scope matches. False when it does not match. Null when it is not configured.',
    'plugins.*.priority': 'The priority of the plugin. Null when the plugin does not match.',
    'plugins.*.access_has_executed': 'True after the plugin ran its access phase. Null when it is not configured.',
  },
  aliases: { plugin: 'plugins' },
})

/** `default(expression, fallback)`. Not for expressible fields: see `kongExpressibleField`. */
export const kongFallback = (): CelPlugin => ({
  functions: [celFunction('default', ['expression', 'fallback'], 'The fallback value when the expression fails at runtime.')],
})

/** ACL rules (`allow_when`/`deny_when`) run outside the plugins iterator, so they cannot read plugin state. */
export const kongAclRule = (): CelPlugin => ({
  checkPath: ([root]) => root === 'plugins' ? { kind: 'plugin-state' } : undefined,
})

/** An expressible field (`expressions.*`) falls back to its config value, so the Gateway rejects `default()` there. */
export const kongExpressibleField = (): CelPlugin => ({
  check: expression => /^\s*default\s*\(/.test(maskCelLiterals(expression)) ? { kind: 'default' } : undefined,
})
