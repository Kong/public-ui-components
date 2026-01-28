import { z } from 'zod'
import { DatakitConfigCompletionSchema } from './completion'

const IdRefSchema = z.object({ id: z.string() }).strict()

const PartialSchema = z
  .object({
    id: z.string(),
    path: z.string().optional(),
  })
  .strict()

/**
 * Schema for the Datakit plugin data payload (editor root).
 * Used for editor completion only; validation still uses strict/compat config schemas.
 */
export const DatakitPluginDataSchema = z
  .object({
    config: DatakitConfigCompletionSchema.nullish(),
    instance_name: z.string().nullish(),
    partials: z.array(PartialSchema).nullish(),
    protocols: z.array(z.string()).nullish(),
    consumer_group: IdRefSchema.nullish(),
    consumer: IdRefSchema.nullish(),
    enabled: z.boolean().nullish(),
    name: z.string().nullish(),
    route: IdRefSchema.nullish(),
    service: IdRefSchema.nullish(),
    tags: z.array(z.string()).nullish(),
  })
  .strict()
