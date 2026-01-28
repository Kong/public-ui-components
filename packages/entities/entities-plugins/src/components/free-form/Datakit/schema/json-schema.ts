import { toJSONSchema } from 'zod'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './compat'
import { DatakitConfigSchemaBase as DatakitConfigStrictSchema } from './config-base'
import { DatakitPluginDataSchema } from './plugin-data'

export type JsonSchema = Record<string, unknown>

type Mode = 'strict' | 'compat'

const PLUGIN_SCHEMA_ID = 'inmemory://model/datakit.plugin.schema.json'
const CONFIG_SCHEMA_ID = 'inmemory://model/datakit.config.schema.json'

let pluginSchemaCache: JsonSchema | null = null
const configSchemaCache: Record<Mode, JsonSchema | null> = {
  strict: null,
  compat: null,
}

export function getDatakitPluginJsonSchema(): JsonSchema {
  if (pluginSchemaCache) {
    return pluginSchemaCache
  }

  pluginSchemaCache = toJSONSchema(DatakitPluginDataSchema, {
    target: 'draft-07',
  }) as JsonSchema

  if (!pluginSchemaCache.$id) {
    pluginSchemaCache.$id = PLUGIN_SCHEMA_ID
  }

  return pluginSchemaCache
}

export function getDatakitConfigJsonSchema(mode: Mode): JsonSchema {
  if (configSchemaCache[mode]) {
    return configSchemaCache[mode] as JsonSchema
  }

  const schema = mode === 'compat'
    ? DatakitConfigCompatSchema
    : DatakitConfigStrictSchema

  const jsonSchema = toJSONSchema(schema, {
    target: 'draft-07',
  }) as JsonSchema

  if (!jsonSchema.$id) {
    jsonSchema.$id = CONFIG_SCHEMA_ID
  }

  configSchemaCache[mode] = jsonSchema
  return jsonSchema
}
