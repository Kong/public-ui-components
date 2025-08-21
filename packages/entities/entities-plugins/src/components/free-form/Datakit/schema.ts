// schema.ts
import { z } from 'zod'
import { HTTP_METHODS } from './constants'

/** Runtime-reserved implicit node types. */
export const IMPLICIT_NODE_TYPES = [
  'request',
  'service_request',
  'service_response',
  'response',
] as const

export const ImplicitNodeTypeSchema = z.enum(IMPLICIT_NODE_TYPES)
/** Implicit node types in the request/response cycle. */
export type ImplicitNodeType = z.infer<typeof ImplicitNodeTypeSchema>

/** Runtime-reserved implicit node names that must not be reused. */
export const ImplicitNodeNameSchema = ImplicitNodeTypeSchema
export type ImplicitNodeName = ImplicitNodeType

const isImplicitName = (s: string) =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(s)

/** All explicit node types recognised by Datakit. */
export const ConfigNodeTypeSchema = z.enum([
  'call',
  'jq',
  'exit',
  'property',
  'static',
])
export type ConfigNodeType = z.infer<typeof ConfigNodeTypeSchema>

/** Union of explicit and implicit node types. */
export const NodeTypeSchema = z.union([
  ConfigNodeTypeSchema,
  ImplicitNodeTypeSchema,
])
export type NodeType = z.infer<typeof NodeTypeSchema>

/**
 * A label that uniquely identifies the node within the plugin configuration
 * so that it can be used for input/output connections. Must be valid
 * snake_case or kebab-case.
 *
 * Rules:
 * - 1–255 characters
 * - Starts with a letter or "_"
 * - Contains only letters, digits, "_" or "-"
 * - Must not clash with implicit node names
 *
 * @example "snake_case"
 * @example "SCREAMING_SNAKE_CASE"
 * @example "kebab-case"
 * @example "KEBAB-CASE"
 * @example "set-property"
 * @example "get-property"
 * @example "send_api_request"
 * @example "filter_01"
 * @example "filter_02"
 */
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

/** Union of implicit node names and configuration-defined node names. */
export const NodeNameSchema = z.union([
  ImplicitNodeNameSchema,
  ConfigNodeNameSchema,
])
export type NodeName = z.infer<typeof NodeNameSchema>

/** Branded field name used inside inputs/outputs maps. */
const FIELD_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,254}$/
export const FieldNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(FIELD_NAME_RE, 'Invalid field name')
  .brand<'FieldName'>()
export type FieldName = z.infer<typeof FieldNameSchema>

/**
 * A connection string referencing a node or a node field.
 * Format: "NODE" | "NODE.FIELD".
 */
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

/** Optional and nullable connection string. */
export const NullishNameConnectionSchema = NameConnectionSchema.nullish()

/**
 * The type of HTTP method accepted by the call node.
 * The string must contain only uppercase letters.
 *
 * @default "GET"
 */
export const HttpMethodSchema = z.enum(HTTP_METHODS)
export type HttpMethod = z.infer<typeof HttpMethodSchema>

/** Make an external HTTP request. */
export const CallNodeSchema = z
  .object({
    type: z.literal('call'),
    name: ConfigNodeNameSchema,
    method: HttpMethodSchema.nullish()
      .default('GET')
      .describe(
        'A string representing an HTTP method, such as GET, POST, PUT, or DELETE. The string must contain only uppercase letters. Default: GET.',
      ),
    ssl_server_name: z
      .string()
      .min(1)
      .nullish()
      .describe(
        'A string representing an SNI (server name indication) value for TLS.',
      ),
    timeout: z
      .number()
      .int()
      .min(0)
      .max(2147483646)
      .nullish()
      .describe(
        'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
      ),
    url: z
      .url()
      .describe(
        'A string representing a URL, such as https://example.com/path?q=search.',
      ),
    input: NullishNameConnectionSchema.describe(
      'call node input ("NODE" or "NODE.FIELD").',
    ),
    inputs: z
      .object({
        body: NullishNameConnectionSchema.describe(
          'HTTP request body ("NODE" or "NODE.FIELD").',
        ),
        headers: NullishNameConnectionSchema.describe(
          'HTTP request headers ("NODE" or "NODE.FIELD").',
        ),
        query: NullishNameConnectionSchema.describe(
          'HTTP request query ("NODE" or "NODE.FIELD").',
        ),
      })
      .partial()
      .nullish()
      .describe('call node inputs.'),
    output: NullishNameConnectionSchema.describe(
      'call node output ("NODE" or "NODE.FIELD").',
    ),
    outputs: z
      .object({
        body: NullishNameConnectionSchema.describe(
          'HTTP response body ("NODE" or "NODE.FIELD").',
        ),
        headers: NullishNameConnectionSchema.describe(
          'HTTP response headers ("NODE" or "NODE.FIELD").',
        ),
        status: NullishNameConnectionSchema.describe(
          'HTTP response status code ("NODE" or "NODE.FIELD").',
        ),
      })
      .partial()
      .nullish()
      .describe('call node outputs.'),
  })
  .strict()
export type CallNode = z.infer<typeof CallNodeSchema>

/** Terminate the request and send a response to the client. */
export const ExitNodeSchema = z
  .object({
    type: z.literal('exit'),
    name: ConfigNodeNameSchema,
    status: z
      .number()
      .int()
      .min(200)
      .max(599)
      .nullish()
      .default(200)
      .describe('HTTP status code. 200–599. Default: 200.'),
    warn_headers_sent: z
      .boolean()
      .nullish()
      .describe('When true, warn if headers have been sent already.'),
    input: NullishNameConnectionSchema.describe(
      'exit node input ("NODE" or "NODE.FIELD").',
    ),
    inputs: z
      .object({
        body: NullishNameConnectionSchema.describe(
          'HTTP response body ("NODE" or "NODE.FIELD").',
        ),
        headers: NullishNameConnectionSchema.describe(
          'HTTP response headers ("NODE" or "NODE.FIELD").',
        ),
      })
      .partial()
      .nullish()
      .describe('exit node inputs.'),
  })
  .strict()
export type ExitNode = z.infer<typeof ExitNodeSchema>

/** Process data using jq syntax. Refer to https://jqlang.org/manual/. */
export const JqNodeSchema = z
  .object({
    type: z.literal('jq'),
    name: ConfigNodeNameSchema,
    jq: z
      .string()
      .min(1)
      .max(10240)
      .describe('The jq filter text. 1–10240 characters.'),
    input: NullishNameConnectionSchema.describe(
      'filter input ("NODE" or "NODE.FIELD").',
    ),
    inputs: z
      .record(FieldNameSchema, NullishNameConnectionSchema)
      .nullish()
      .describe('filter inputs keyed by field name.'),
    output: NullishNameConnectionSchema.describe(
      'filter output ("NODE" or "NODE.FIELD").',
    ),
  })
  .strict()
export type JqNode = z.infer<typeof JqNodeSchema>

/** Get or set a property. */
export const PropertyNodeSchema = z
  .object({
    type: z.literal('property'),
    name: ConfigNodeNameSchema,
    content_type: z
      .enum(['application/json', 'text/plain', 'application/octet-stream'])
      .nullish()
      .describe(
        'The expected MIME type of the property value. When set to application/json, SET operations JSON-encode input data before writing it, and GET operations JSON-decode output data after reading it. Otherwise, this setting has no effect.',
      ),
    property: z.string().min(1).describe('The property name to get/set.'),
    input: NullishNameConnectionSchema.describe(
      'Property input source. When connected, operates in SET mode; otherwise, GET mode.',
    ),
    output: NullishNameConnectionSchema.describe(
      'Property output. Can be connected regardless of mode.',
    ),
  })
  .strict()
export type PropertyNode = z.infer<typeof PropertyNodeSchema>

/** Produce reusable outputs from statically-configured values. */
export const StaticNodeSchema = z
  .object({
    type: z.literal('static'),
    name: ConfigNodeNameSchema,
    values: z
      .record(z.string(), z.unknown())
      .describe('An object with string keys and free-form values.'),
    output: NullishNameConnectionSchema.describe(
      'The entire .values map ("NODE" or "NODE.FIELD").',
    ),
    outputs: z
      .record(FieldNameSchema, NullishNameConnectionSchema)
      .nullish()
      .describe('Individual items from .values, referenced by key.'),
  })
  .strict()
export type StaticNode = z.infer<typeof StaticNodeSchema>

/** Discriminated union of all node types. */
export const ConfigNodeSchema = z.discriminatedUnion('type', [
  CallNodeSchema,
  ExitNodeSchema,
  JqNodeSchema,
  PropertyNodeSchema,
  StaticNodeSchema,
])
export type ConfigNode = z.infer<typeof ConfigNodeSchema>

type AnyNode = z.infer<typeof ConfigNodeSchema>
type ConnectionDirection = 'in' | 'out'
type ConnectionItem = {
  nodeName: string
  dir: ConnectionDirection
  path: Array<string | number>
  value: string
}

function iterConnections(node: AnyNode, nodeIndex: number): ConnectionItem[] {
  const out: ConnectionItem[] = []
  const push = (
    dir: ConnectionDirection,
    path: Array<string | number>,
    v: unknown,
  ) => {
    if (typeof v === 'string') {
      out.push({
        nodeName: (node as any).name,
        dir,
        path: ['nodes', nodeIndex, ...path],
        value: v,
      })
    }
  }
  if ('input' in node && node.input != null) push('in', ['input'], node.input)
  if ('inputs' in node && node.inputs && typeof node.inputs === 'object') {
    for (const [k, v] of Object.entries(
      node.inputs as Record<string, unknown>,
    )) {
      if (v != null) push('in', ['inputs', k], v)
    }
  }
  if ('output' in node && node.output != null)
    push('out', ['output'], node.output)
  if ('outputs' in node && node.outputs && typeof node.outputs === 'object') {
    for (const [k, v] of Object.entries(
      node.outputs as Record<string, unknown>,
    )) {
      if (v != null) push('out', ['outputs', k], v)
    }
  }
  return out
}

function hasAnyNonNullEntry(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v != null) return true
  }
  return false
}

/** Datakit plugin configuration. */
export const DatakitConfigSchema = z
  .object({
    nodes: z
      .array(ConfigNodeSchema)
      .min(1, 'At least one node is required')
      .describe('Datakit nodes. Must contain at least one element.'),
    debug: z
      .boolean()
      .nullish()
      .default(false)
      .describe('Enable verbose debug logging. Default: false.'),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    const names = cfg.nodes.map((n) => n.name)
    const seen = new Set<string>()
    names.forEach((name, i) => {
      if (seen.has(name)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate node name: "${name}"`,
          path: ['nodes', i, 'name'],
        })
      }
      seen.add(name)
    })

    cfg.nodes.forEach((node, i) => {
      const hasInput = 'input' in node && node.input != null
      const hasInputs =
        'inputs' in node && hasAnyNonNullEntry((node as any).inputs)
      if (hasInput && hasInputs) {
        ctx.addIssue({
          code: 'custom',
          message:
            'A node cannot use both "input" and "inputs". Use one or the other.',
          path: ['nodes', i, 'inputs'],
        })
      }
    })

    const allowed = new Set<string>([...IMPLICIT_NODE_TYPES, ...names])
    const pairOutPath = new Map<string, Array<string | number>>()
    const pairInPath = new Map<string, Array<string | number>>()

    cfg.nodes.forEach((node, i) => {
      const conns = iterConnections(node, i)
      for (const item of conns) {
        const other = item.value.split('.', 1)[0]!
        if (!allowed.has(other)) {
          ctx.addIssue({
            code: 'custom',
            message: `Unknown node "${other}" in connection "${item.value}"`,
            path: item.path,
          })
        }
        if (item.dir === 'out') {
          const key = `${item.nodeName}->${other}`
          pairOutPath.set(key, pairOutPath.get(key) ?? item.path)
          if (pairInPath.has(key)) {
            ctx.addIssue({
              code: 'custom',
              message: `Connection specified on both sides: "${item.nodeName}" outputs to "${other}" and "${other}" inputs from "${item.nodeName}". Specify it on one side only.`,
              path: item.path,
            })
          }
        } else {
          const key = `${other}->${item.nodeName}`
          pairInPath.set(key, pairInPath.get(key) ?? item.path)
          if (pairOutPath.has(key)) {
            ctx.addIssue({
              code: 'custom',
              message: `Connection specified on both sides: "${other}" outputs to "${item.nodeName}" and "${item.nodeName}" inputs from "${other}". Specify it on one side only.`,
              path: item.path,
            })
          }
        }
      }
    })
  })
export type DatakitConfig = z.infer<typeof DatakitConfigSchema>
