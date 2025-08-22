import { z } from 'zod'
import {
  ConfigNodeBaseGuard,
  HttpMethodSchema,
  IMPLICIT_NODE_TYPES,
  isImplicitName,
} from './strict'
import { validateNamesAndConnections } from './shared'

const LooseNodeNameSchema = z
  .string()
  .min(1)
  .refine((s) => !s.includes('.'), 'Invalid node name')
  .refine(
    (s) => !isImplicitName(s),
    'Node name conflicts with reserved implicit node',
  )
const LooseFieldNameSchema = z.string().min(1)
const LooseConnectionSchema = z.string().refine((s) => {
  if (!s || /\s/.test(s)) return false
  const i = s.indexOf('.')
  if (i === -1) return true
  const left = s.slice(0, i)
  const right = s.slice(i + 1)
  return left.length > 0 && right.length > 0
}, 'Invalid connection')

const CallNodeSchema = z
  .object({
    type: z.literal('call'),
    name: LooseNodeNameSchema,
    method: HttpMethodSchema.nullish().default('GET'),
    ssl_server_name: z.string().nullish(),
    timeout: z.union([z.number(), z.string()]).nullish(),
    url: z.string().nullish(),
    input: LooseConnectionSchema.nullish(),
    inputs: z
      .object({
        body: LooseConnectionSchema.nullish(),
        headers: LooseConnectionSchema.nullish(),
        query: LooseConnectionSchema.nullish(),
      })
      .partial()
      .nullish(),
    output: LooseConnectionSchema.nullish(),
    outputs: z
      .object({
        body: LooseConnectionSchema.nullish(),
        headers: LooseConnectionSchema.nullish(),
        status: LooseConnectionSchema.nullish(),
      })
      .partial()
      .nullish(),
  })
  .strict()

const ExitNodeSchema = z
  .object({
    type: z.literal('exit'),
    name: LooseNodeNameSchema,
    status: z.number().nullish(),
    warn_headers_sent: z.boolean().nullish(),
    input: LooseConnectionSchema.nullish(),
    inputs: z
      .object({
        body: LooseConnectionSchema.nullish(),
        headers: LooseConnectionSchema.nullish(),
      })
      .partial()
      .nullish(),
  })
  .strict()

const JqNodeSchema = z
  .object({
    type: z.literal('jq'),
    name: LooseNodeNameSchema,
    jq: z.string().nullish(),
    input: LooseConnectionSchema.nullish(),
    inputs: z
      .record(LooseFieldNameSchema, LooseConnectionSchema.nullish())
      .nullish(),
    output: LooseConnectionSchema.nullish(),
  })
  .strict()

const PropertyNodeSchema = z
  .object({
    type: z.literal('property'),
    name: LooseNodeNameSchema,
    content_type: z.string().nullish(),
    property: z.string().nullish(),
    input: LooseConnectionSchema.nullish(),
    output: LooseConnectionSchema.nullish(),
  })
  .strict()

const StaticNodeSchema = z
  .object({
    type: z.literal('static'),
    name: LooseNodeNameSchema,
    values: z.record(z.string(), z.unknown()).nullish(),
    output: LooseConnectionSchema.nullish(),
    outputs: z
      .record(LooseFieldNameSchema, LooseConnectionSchema.nullish())
      .nullish(),
  })
  .strict()

const ConfigNodeSchema = ConfigNodeBaseGuard.pipe(
  z.discriminatedUnion('type', [
    CallNodeSchema,
    ExitNodeSchema,
    JqNodeSchema,
    PropertyNodeSchema,
    StaticNodeSchema,
  ]),
)

export const DatakitConfigSchema = z
  .object({
    nodes: z.array(ConfigNodeSchema).nullish(),
    debug: z.boolean().nullish(),
  })
  .strict()
  .superRefine((config, ctx) => {
    validateNamesAndConnections(config, IMPLICIT_NODE_TYPES, ctx)
  })
  .nullish()
