import { z } from 'zod'
import { CONFIG_NODE_TYPES, HTTP_METHODS, IMPLICIT_NODE_NAMES, IMPLICIT_NODE_TYPES } from '../constants'
import { validateNamesAndConnections } from './shared'

export const ImplicitNodeTypeSchema = z.enum(IMPLICIT_NODE_TYPES)

/** Runtime-reserved implicit node types. */
export type ImplicitNodeType = z.infer<typeof ImplicitNodeTypeSchema>

export const ImplicitNodeNameSchema = z.enum(IMPLICIT_NODE_NAMES)

/** Runtime-reserved implicit node names that must not be reused. */
export type ImplicitNodeName = z.infer<typeof ImplicitNodeNameSchema>

export const isImplicitName = (s: string) =>
  (IMPLICIT_NODE_NAMES as readonly string[]).includes(s)

export const ConfigNodeTypeSchema = z.enum(CONFIG_NODE_TYPES)
const KNOWN_NODE_TYPES = ConfigNodeTypeSchema.options

/** All explicit node types recognized by Datakit. */
export type ConfigNodeType = z.infer<typeof ConfigNodeTypeSchema>

export const NodeTypeSchema = z.union([
  ConfigNodeTypeSchema,
  ImplicitNodeTypeSchema,
])
export type NodeType = z.infer<typeof NodeTypeSchema>

const CONFIG_NODE_NAME_RE = /^[A-Za-z_][A-Za-z0-9_-]{0,254}$/
export const ConfigNodeNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(
    CONFIG_NODE_NAME_RE,
    'Invalid node name (snake_case / kebab-case only)',
  )
  .refine((s) => !isImplicitName(s), 'Name clashes with reserved implicit node')
  .brand<'ConfigNodeName'>()
export type ConfigNodeName = z.infer<typeof ConfigNodeNameSchema>

export const NodeNameSchema = z.union([
  ImplicitNodeNameSchema,
  ConfigNodeNameSchema,
])
export type NodeName = z.infer<typeof NodeNameSchema>

export const FieldNameSchema = z.string().min(1).brand<'FieldName'>()
export type FieldName = z.infer<typeof FieldNameSchema>

export const NameConnectionSchema = z.string().refine((s) => {
  if (NodeNameSchema.safeParse(s).success) return true
  const m = s.match(/^([^.]+)\.([^.]+)$/)
  if (!m) return false
  const [, node, field] = m
  return (
    NodeNameSchema.safeParse(node).success &&
    FieldNameSchema.safeParse(field).success
  )
}, 'Invalid connection, expected "NODE" or "NODE.FIELD"')
export type NameConnection = z.infer<typeof NameConnectionSchema>

export const NullishNameConnectionSchema = NameConnectionSchema.nullish()

export const HttpMethodSchema = z.enum(HTTP_METHODS)

/**
 * Standard HTTP/1.1 verbs accepted by the `call` node.
 * The string must contain only uppercase letters.
 */
export type HttpMethod = z.infer<typeof HttpMethodSchema>

export const ConfigNodeBaseSchema = z
  .object({
    type: z.string(),
    name: ConfigNodeNameSchema,
    input: NullishNameConnectionSchema,
    inputs: z.record(z.string(), NullishNameConnectionSchema).nullish(),
    output: NullishNameConnectionSchema,
    outputs: z.record(z.string(), NullishNameConnectionSchema).nullish(),
  })
  .loose()

export const ConfigNodeBaseGuard = z
  .object({ type: z.string(), name: z.string() })
  .loose()
  .superRefine((obj, ctx) => {
    const t = obj.type
    const nm = obj.name
    if (typeof nm !== 'string' || nm.length === 0 || nm.includes('.')) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'invalid node name',
        fatal: false,
      })
    }
    if (!KNOWN_NODE_TYPES.includes(t as any)) {
      ctx.addIssue({
        code: 'custom',
        path: ['type'],
        message: `unknown node type "${t}", expected one of: ${KNOWN_NODE_TYPES.join(
          ', ',
        )}`,
      })
    }
  })

export const CallNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('call'),
  /**
   * A string representing an HTTP method, such as GET, POST, PUT, or DELETE.
   * The string must contain only uppercase letters.
   */
  method: HttpMethodSchema.nullish(),
  /** A string representing an SNI (server name indication) value for TLS. */
  ssl_server_name: z.string().min(1).nullish(),
  /**
   * An integer representing a timeout in milliseconds.
   * Must be between 0 and 2^31-2.
   */
  timeout: z.number().int().min(0).max(2147483646).nullish(),
  /**
   * A string representing a URL, such as
   * https://example.com/path/to/resource?q=search
   */
  url: z.url(),
  inputs: z
    .object({
      body: NullishNameConnectionSchema,
      headers: NullishNameConnectionSchema,
      query: NullishNameConnectionSchema,
    })
    .partial()
    .nullish(),
  outputs: z
    .object({
      body: NullishNameConnectionSchema,
      headers: NullishNameConnectionSchema,
      status: NullishNameConnectionSchema,
    })
    .partial()
    .nullish(),
}).strict()

/** Make an external HTTP request. */
export type CallNode = z.infer<typeof CallNodeSchema>

export const ExitNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('exit'),
  /**
   * HTTP status code.
   * 200–599
   */
  status: z.number().int().min(200).max(599).nullish(),
  /** When true, warn if headers have been sent already. */
  warn_headers_sent: z.boolean().nullish(),
  output: z.never().optional(),
  outputs: z.never().optional(),
}).strict()

/** Terminate the request and send a response to the client. */
export type ExitNode = z.infer<typeof ExitNodeSchema>

export const JqNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('jq'),
  /**
   * The jq filter text. Refer to https://jqlang.org/manual/ for full documentation.
   * 1–10240 characters
   */
  jq: z.string().min(1).max(10240),
  outputs: z.never().optional(),
}).strict()

/** Process data using `jq` syntax. */
export type JqNode = z.infer<typeof JqNodeSchema>

export const PropertyNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('property'),
  /**
   * The expected MIME type of the property value. When set to `application/json`,
   * SET operations JSON-encode input data before writing it, and GET operations
   * JSON-decode output data after reading it. Otherwise, this setting has no effect.
   */
  content_type: z
    .enum(['application/json', 'text/plain', 'application/octet-stream'])
    .nullish(),
  /** The property name to get/set. */
  property: z.string().min(1),
  inputs: z.never().optional(),
  outputs: z.never().optional(),
}).strict()

/** Get or set a property. */
export type PropertyNode = z.infer<typeof PropertyNodeSchema>

export const StaticNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('static'),
  /** An object with string keys and free-form values. */
  values: z.record(z.string(), z.unknown()),
  input: z.never().optional(),
  inputs: z.never().optional(),
}).strict()

/** Produce reusable outputs from statically-configured values. */
export type StaticNode = z.infer<typeof StaticNodeSchema>

export const ConfigNodeSchema = ConfigNodeBaseGuard.pipe(
  z.discriminatedUnion('type', [
    CallNodeSchema,
    ExitNodeSchema,
    JqNodeSchema,
    PropertyNodeSchema,
    StaticNodeSchema,
  ]),
)

/** Discriminated union of all node types. */
export type ConfigNode = z.infer<typeof ConfigNodeSchema>

export const VaultSchema = z
  .record(
    z.string().regex(/^[A-Za-z_][A-Za-z0-9_-]*$/).min(1).max(255),
    z.string().min(1).max(4095),
  )

/** cache.memory */
const CacheMemorySchema = z.object({
  dictionary_name: z.string().default('kong_db_cache'),
})

/** cache.redis.sentinel_nodes / cluster_nodes */
const SentinelNodeSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().min(0).max(65535).default(6379),
})

const ClusterNodeSchema = z.object({
  ip: z.string().default('127.0.0.1'),
  port: z.number().int().min(0).max(65535).default(6379),
})

/** cache.redis */
const CacheRedisSchema = z
  .object({
    host: z.string().optional().default('127.0.0.1'),
    port: z.number().int().min(0).max(65535).optional().default(6379),

    connect_timeout: z
      .number()
      .int()
      .min(0)
      .max(2147483646)
      .default(2000),
    send_timeout: z
      .number()
      .int()
      .min(0)
      .max(2147483646)
      .default(2000),
    read_timeout: z
      .number()
      .int()
      .min(0)
      .max(2147483646)
      .default(2000),

    username: z.string().optional(),
    password: z.string().optional(),

    sentinel_username: z.string().optional(),
    sentinel_password: z.string().optional(),

    database: z.number().int().optional().default(0),

    keepalive_pool_size: z
      .number()
      .int()
      .min(1)
      .max(2147483646)
      .default(256),
    keepalive_backlog: z
      .number()
      .int()
      .min(0)
      .max(2147483646)
      .optional(),

    sentinel_master: z.string().optional(),
    sentinel_role: z.enum(['master', 'slave', 'any']).optional(),
    sentinel_nodes: z
      .array(SentinelNodeSchema)
      .min(1, { message: 'sentinel_nodes must contain at least 1 item' })
      .optional(),

    cluster_nodes: z
      .array(ClusterNodeSchema)
      .min(1, { message: 'cluster_nodes must contain at least 1 item' })
      .optional(),

    ssl: z.boolean().default(false).optional(),
    ssl_verify: z.boolean().default(false).optional(),
    server_name: z.string().optional(),
    cluster_max_redirections: z.number().int().default(5).optional(),
    connection_is_proxied: z.boolean().default(false).optional(),

    /** --- Compatibility for deprecated fields (optional) --- */
    timeout: z.number().int().optional(), // deprecated: use connect_timeout, send_timeout and read_timeout instead
    sentinel_addresses: z.array(z.string()).min(1).optional(), // deprecated
    cluster_addresses: z.array(z.string()).min(1).optional(), // deprecated
  })
  .superRefine((val, ctx) => {
    // 1) host & port are mutually required
    const hasHost = val.host !== undefined && val.host !== null
    const hasPort = val.port !== undefined && val.port !== null
    if ((hasHost && !hasPort) || (!hasHost && hasPort)) {
      ctx.addIssue({
        code: 'custom',
        message: 'host and port must be specified together',
        path: hasHost ? ['port'] : ['host'],
      })
    }

    // 2) sentinel_master & sentinel_role & sentinel_nodes must appear together or all be missing
    const hasSentinelMaster = !!val.sentinel_master
    const hasSentinelRole = !!val.sentinel_role
    const hasSentinelNodes = !!val.sentinel_nodes?.length
    const count = [hasSentinelMaster, hasSentinelRole, hasSentinelNodes].filter(
      Boolean,
    ).length
    if (count > 0 && count < 3) {
      ctx.addIssue({
        code: 'custom',
        message:
          'sentinel_master, sentinel_role and sentinel_nodes must be provided together',
      })
    }

    // 3) host is required when connection_is_proxied === true
    if (val.connection_is_proxied === true && !hasHost) {
      ctx.addIssue({
        code: 'custom',
        message:
          'host is required when connection_is_proxied is true (host/port should point to the proxy)',
        path: ['host'],
      })
    }
  })

export const CacheSchema = z.object({
  strategy: z.enum(['memory', 'redis']).optional(),
  memory: CacheMemorySchema,
  redis: CacheRedisSchema,
})

export const ResourcesSchema = z.object({
  vault: VaultSchema.nullish(),
  cache: CacheSchema.nullish(),
})

export type Resources = z.infer<typeof ResourcesSchema>

export const PartialsSchema = z.array(z.object({ id: z.string() }))

export const DatakitConfigSchema = z
  .object({
    nodes: z.array(ConfigNodeSchema).min(1, 'At least one node is required'),
    debug: z.boolean().nullish(),
    resources: ResourcesSchema.nullish(),
  })
  .strict()
  .superRefine((config, ctx) => {
    validateNamesAndConnections(config, IMPLICIT_NODE_NAMES, ctx)
  })

/** Datakit plugin configuration. */
export type DatakitConfig = z.infer<typeof DatakitConfigSchema>
