import { z } from 'zod'
import {
  CacheNodeSchema,
  CallNodeSchema,
  ConfigNodeNameSchema,
  DatakitConfigSchemaBase,
  ExitNodeSchema,
  JqNodeSchema,
  JsonToXmlNodeSchema,
  NullishNameConnectionSchema,
  PropertyNodeSchema,
  StaticNodeSchema,
  XmlToJsonNodeSchema,
} from './config-base'

const BranchNodeCompletionSchema = z
  .object({
    type: z.literal('branch'),
    name: ConfigNodeNameSchema,
    input: NullishNameConnectionSchema,
    then: z.array(ConfigNodeNameSchema).nullish(),
    else: z.array(ConfigNodeNameSchema).nullish(),
  })
  .strict()

const ConfigNodeCompletionSchema = z.discriminatedUnion('type', [
  CallNodeSchema,
  ExitNodeSchema,
  JqNodeSchema,
  XmlToJsonNodeSchema,
  JsonToXmlNodeSchema,
  PropertyNodeSchema,
  StaticNodeSchema,
  CacheNodeSchema,
  BranchNodeCompletionSchema,
])

export const DatakitConfigCompletionSchema = DatakitConfigSchemaBase.extend({
  nodes: z
    .array(ConfigNodeCompletionSchema)
    .min(1, 'At least one node is required')
    .max(64),
})
