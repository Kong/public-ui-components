import type { DatakitConfig } from './strict'

import { z } from 'zod'
import {
  HttpMethodSchema,
  isImplicitName,
  ConfigNodeTypeSchema,
} from './strict'
import {
  validateInputOutputExclusivity,
  validateNamesAndConnections,
} from './shared'
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
  .superRefine((node, ctx) => {
    validateInputOutputExclusivity(node, ctx)
  })

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

const CallNodeSchema = ConfigNodeBaseSchema.safeExtend({
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

const ExitNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('exit'),
  status: z.union([z.number(), z.string()]).nullish(),
  warn_headers_sent: z.boolean().nullish(),
  output: z.never().nullish(),
  outputs: z.never().nullish(),
}).strict()

const JqNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('jq'),
  jq: z.string().nullish(),
  outputs: z.never().nullish(),
}).strict()

const XmlToJsonNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('xml_to_json'),
  recognize_type: z.boolean().nullish(),
  attributes_block_name: z.string().nullish(),
  attributes_name_prefix: z.string().nullish(),
  text_block_name: z.string().nullish(),
  text_as_property: z.boolean().nullish(),
  xpath: z.string().nullish(),
  inputs: z.never().nullish(),
  outputs: z.never().nullish(),
})
  .strict()

const JsonToXmlNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('json_to_xml'),
  attributes_block_name: z.string().nullish(),
  attributes_name_prefix: z.string().nullish(),
  root_element_name: z.string().nullish(),
  text_block_name: z.string().nullish(),
  inputs: z.record(z.string(), LooseConnectionSchema.nullish()).nullish(),
  outputs: z.never().nullish(),
})
  .strict()

const PropertyNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('property'),
  content_type: z.string().nullish(),
  property: z.string().nullish(),
  inputs: z.never().nullish(),
  outputs: z.never().nullish(),
}).strict()

const StaticNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('static'),
  values: z.record(z.string(), z.unknown()).nullish(),
  input: z.never().nullish(),
  inputs: z.never().nullish(),
}).strict()

const CacheNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('cache'),
  bypass_on_error: z.boolean().nullish(),
  inputs: z
    .object({
      data: LooseConnectionSchema.nullish(),
      key: LooseConnectionSchema.nullish(),
      ttl: LooseConnectionSchema.nullish(),
    })
    .partial()
    .nullish(),
  outputs: z
    .object({
      data: LooseConnectionSchema.nullish(),
      hit: LooseConnectionSchema.nullish(),
      miss: LooseConnectionSchema.nullish(),
      stored: LooseConnectionSchema.nullish(),
    })
    .partial()
    .nullish(),
  ttl: z.union([z.number(), z.string()]).nullish(),
}).strict()

/**
 * Branch node schema with loose validation.
 * Supports conditional execution with `then` and `else` branches.
 * Each branch contains an array of node names to execute.
 */
export const BranchNodeSchema = ConfigNodeBaseSchema.safeExtend({
  type: z.literal('branch'),
  then: z.array(LooseNodeNameSchema).nullish(),
  else: z.array(LooseNodeNameSchema).nullish(),
}).strict()

const ConfigNodeSchema = ConfigNodeBaseGuard.pipe(
  z.discriminatedUnion('type', [
    CallNodeSchema,
    ExitNodeSchema,
    JqNodeSchema,
    XmlToJsonNodeSchema,
    JsonToXmlNodeSchema,
    PropertyNodeSchema,
    StaticNodeSchema,
    CacheNodeSchema,
    BranchNodeSchema,
  ]),
)

export const LooseVaultSchema = z
  .record(z.string(), z.string())

/** cache.memory */
const CacheMemorySchema = z.object({
  dictionary_name: z.string().nullish(),
})

/** cache.redis */
const LooseCacheRedisSchema = z.object()

export const LooseCacheSchema = z.object({
  strategy: z.enum(['memory', 'redis']).nullish(),
  memory: CacheMemorySchema.nullish(),
  redis: LooseCacheRedisSchema.nullish(),
})

export const LooseResourcesSchema = z.object({
  vault: LooseVaultSchema.nullish(),
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
