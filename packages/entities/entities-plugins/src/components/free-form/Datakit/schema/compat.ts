import type { DatakitConfig } from './strict'

import { z } from 'zod'
import {
  HttpMethodSchema,
  isImplicitName,
  ConfigNodeTypeSchema,
} from './strict'
import { validateNamesAndConnections } from './shared'
import { IMPLICIT_NODE_NAMES } from '../constants'

const KNOWN_NODE_TYPES = ConfigNodeTypeSchema.options

const LooseNodeNameSchema = z
  .string()
  .min(1)
  .refine((s) => !s.includes('.'), 'Invalid node name')
  .refine(
    (s) => !isImplicitName(s),
    'Node name conflicts with reserved implicit node',
  )

const LooseConnectionSchema = z.string().refine((s) => {
  if (!s || /\s/.test(s)) return false
  const i = s.indexOf('.')
  if (i === -1) return true
  const left = s.slice(0, i)
  const right = s.slice(i + 1)
  return left.length > 0 && right.length > 0
}, 'Invalid connection')

export const ConfigNodeBaseSchema = z
  .object({
    type: z.string(),
    name: LooseNodeNameSchema,
    input: LooseConnectionSchema.nullish(),
    inputs: z.record(z.string(), LooseConnectionSchema.nullish()).nullish(),
    output: LooseConnectionSchema.nullish(),
    outputs: z.record(z.string(), LooseConnectionSchema.nullish()).nullish(),
  })
  .loose()

const ConfigNodeBaseGuard = z
  .object({ type: z.string(), name: z.string() })
  .loose()
  .superRefine((obj, ctx) => {
    const t = obj.type
    const nm = obj.name
    if (typeof nm !== 'string' || nm.length === 0 || nm.includes('.')) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'Invalid node name',
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

const CallNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('call'),
  method: HttpMethodSchema.nullish(),
  ssl_server_name: z.string().nullish(),
  timeout: z.union([z.number(), z.string()]).nullish(),
  url: z.string().nullish(),
  inputs: z
    .object({
      body: LooseConnectionSchema.nullish(),
      headers: LooseConnectionSchema.nullish(),
      query: LooseConnectionSchema.nullish(),
    })
    .partial()
    .nullish(),
  outputs: z
    .object({
      body: LooseConnectionSchema.nullish(),
      headers: LooseConnectionSchema.nullish(),
      status: LooseConnectionSchema.nullish(),
    })
    .partial()
    .nullish(),
}).strict()

const ExitNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('exit'),
  status: z.union([z.number(), z.string()]).nullish(),
  warn_headers_sent: z.boolean().nullish(),
  output: z.never().optional(),
  outputs: z.never().optional(),
}).strict()

const JqNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('jq'),
  jq: z.string().nullish(),
  outputs: z.never().optional(),
}).strict()

const PropertyNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('property'),
  content_type: z.string().nullish(),
  property: z.string().nullish(),
  inputs: z.never().optional(),
  outputs: z.never().optional(),
}).strict()

const StaticNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('static'),
  values: z.record(z.string(), z.unknown()).nullish(),
  input: z.never().optional(),
  inputs: z.never().optional(),
}).strict()

export const BranchNodeSchema = ConfigNodeBaseSchema.extend({
  type: z.literal('branch'),
  then: z.array(LooseNodeNameSchema).nullish(),
  else: z.array(LooseNodeNameSchema).nullish(),
}).strict()

const ConfigNodeSchema = ConfigNodeBaseGuard.pipe(
  z.discriminatedUnion('type', [
    CallNodeSchema,
    ExitNodeSchema,
    JqNodeSchema,
    PropertyNodeSchema,
    StaticNodeSchema,
    BranchNodeSchema,
  ]),
)

export const VaultSchema = z
  .record(
    z.string().regex(/^[A-Za-z_][A-Za-z0-9_-]*$/).min(1).max(255),
    z.string().min(1).max(4095),
  )

/** cache.memory */
const CacheMemorySchema = z.object({
  dictionary_name: z.string().default('kong_db_cache'),
})

/** cache.redis */
const LooseCacheRedisSchema = z.object()

export const LooseCacheSchema = z.object({
  strategy: z.enum(['memory', 'redis']).optional(),
  memory: CacheMemorySchema.optional(),
  redis: LooseCacheRedisSchema.optional(),
})

export const LooseResourcesSchema = z.object({
  vault: VaultSchema.nullish(),
  cache: LooseCacheSchema.nullish(),
})

export const DatakitConfigSchema = z
  .object({
    nodes: z.array(ConfigNodeSchema).nullish(),
    debug: z.boolean().nullish(),
    resources: LooseResourcesSchema.nullish(),
  })
  .strict()
  .superRefine((config, ctx) => {
    if (!config || !Array.isArray(config.nodes)) return
    validateNamesAndConnections(config as DatakitConfig, IMPLICIT_NODE_NAMES, ctx)
  })
  .nullish()
