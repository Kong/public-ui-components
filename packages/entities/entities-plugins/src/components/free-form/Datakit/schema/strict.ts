import { z } from 'zod'
import { HTTP_METHODS } from '../constants'
import { validateNamesAndConnections } from './shared'

export const IMPLICIT_NODE_TYPES = [
  'request',
  'service_request',
  'service_response',
  'response',
] as const

export const ImplicitNodeTypeSchema = z.enum(IMPLICIT_NODE_TYPES)
/** Runtime-reserved implicit node typez. */
export type ImplicitNodeType = z.infer<typeof ImplicitNodeTypeSchema>

export const ImplicitNodeNameSchema = ImplicitNodeTypeSchema
/** Runtime-reserved implicit node names that must not be reused. */
export type ImplicitNodeName = ImplicitNodeType

export const isImplicitName = (s: string) =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(s)

export const ConfigNodeTypeSchema = z.enum([
  'call',
  'jq',
  'exit',
  'property',
  'static',
])
const KNOWN_NODE_TYPES = ConfigNodeTypeSchema.options
/** All explicit node types recognised by Datakit. */
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

export const CallNodeSchema = z
  .object({
    type: z.literal('call'),
    name: ConfigNodeNameSchema,
    /**
     * A string representing an HTTP method, such as GET, POST, PUT, or DELETE.
     * The string must contain only uppercase letters.
     *
     * @default 'GET'
     */
    method: HttpMethodSchema.nullish().default('GET'),
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
    /** call node input (`NODE` or `NODE.FIELD`) */
    input: NullishNameConnectionSchema,
    /**
     * call node inputs
     * - body: HTTP request body (`NODE` or `NODE.FIELD`)
     * - headers: HTTP request headers (`NODE` or `NODE.FIELD`)
     * - query: HTTP request query (`NODE` or `NODE.FIELD`)
     */
    inputs: z
      .object({
        body: NullishNameConnectionSchema,
        headers: NullishNameConnectionSchema,
        query: NullishNameConnectionSchema,
      })
      .partial()
      .nullish(),
    /** call node output (`NODE` or `NODE.FIELD`) */
    output: NullishNameConnectionSchema,
    /**
     * call node outputs
     * - body: HTTP response body (`NODE` or `NODE.FIELD`)
     * - headers: HTTP response headers (`NODE` or `NODE.FIELD`)
     * - status: HTTP response status code (`NODE` or `NODE.FIELD`)
     */
    outputs: z
      .object({
        body: NullishNameConnectionSchema,
        headers: NullishNameConnectionSchema,
        status: NullishNameConnectionSchema,
      })
      .partial()
      .nullish(),
  })
  .strict()
/** Make an external HTTP request. */
export type CallNode = z.infer<typeof CallNodeSchema>

export const ExitNodeSchema = z
  .object({
    type: z.literal('exit'),
    name: ConfigNodeNameSchema,
    /**
     * HTTP status code.
     * 200–599
     *
     * @default 200
     */
    status: z.number().int().min(200).max(599).nullish().default(200),
    /** When true, warn if headers have been sent already. */
    warn_headers_sent: z.boolean().nullish(),
    /** exit node input (`NODE` or `NODE.FIELD`) */
    input: NullishNameConnectionSchema,
    /**
     * exit node inputs
     * - body: HTTP response body (`NODE` or `NODE.FIELD`)
     * - headers: HTTP response headers (`NODE` or `NODE.FIELD`)
     */
    inputs: z
      .object({
        body: NullishNameConnectionSchema,
        headers: NullishNameConnectionSchema,
      })
      .partial()
      .nullish(),
  })
  .strict()
/** Terminate the request and send a response to the client. */
export type ExitNode = z.infer<typeof ExitNodeSchema>

export const JqNodeSchema = z
  .object({
    type: z.literal('jq'),
    name: ConfigNodeNameSchema,
    /**
     * The jq filter text. Refer to https://jqlang.org/manual/ for full documentation.
     * 1–10240 characters
     */
    jq: z.string().min(1).max(10240),
    /** filter input (`NODE` or `NODE.FIELD`) */
    input: NullishNameConnectionSchema,
    /** filter input(s) */
    inputs: z.record(FieldNameSchema, NullishNameConnectionSchema).nullish(),
    /** filter output (`NODE` or `NODE.FIELD`) */
    output: NullishNameConnectionSchema,
  })
  .strict()
/** Process data using `jq` syntax. */
export type JqNode = z.infer<typeof JqNodeSchema>

export const PropertyNodeSchema = z
  .object({
    type: z.literal('property'),
    name: ConfigNodeNameSchema,
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
    /**
     * Property input source. When connected, this node operates in SET mode and writes input data to the property.
     * Otherwise, the node operates in GET mode and reads the property.
     */
    input: NullishNameConnectionSchema,
    /**
     * Property output. This can be connected regardless of whether the node is operating in GET mode or SET mode.
     */
    output: NullishNameConnectionSchema,
  })
  .strict()
/** Get or set a property. */
export type PropertyNode = z.infer<typeof PropertyNodeSchema>

export const StaticNodeSchema = z
  .object({
    type: z.literal('static'),
    name: ConfigNodeNameSchema,
    /** An object with string keys and free-form values. */
    values: z.record(z.string(), z.unknown()),
    /** The entire `.values` map (`NODE` or `NODE.FIELD`). */
    output: NullishNameConnectionSchema,
    /** Individual items from `.values`, referenced by key. */
    outputs: z.record(FieldNameSchema, NullishNameConnectionSchema).nullish(),
  })
  .strict()
/** Produce reusable outputs from statically-configured values. */
export type StaticNode = z.infer<typeof StaticNodeSchema>

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

/** Datakit plugin configuration. */
export const DatakitConfigSchema = z
  .object({
    nodes: z.array(ConfigNodeSchema).min(1, 'At least one node is required'),
    debug: z.boolean().nullish().default(false),
  })
  .strict()
  .superRefine((config, ctx) => {
    validateNamesAndConnections(config, IMPLICIT_NODE_TYPES, ctx)
  })
/** Datakit plugin configuration. */
export type DatakitConfig = z.infer<typeof DatakitConfigSchema>
