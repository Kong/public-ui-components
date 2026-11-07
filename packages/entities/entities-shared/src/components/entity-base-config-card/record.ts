import type { ConfigurationSchema } from '../../types'
import useHelpers from '../../composables/useHelpers'

/** Missing display fields belong to the derived card record, never to query data. */
export function withForceShowFields(record: Record<string, any>, configSchema: ConfigurationSchema): Record<string, any> {
  const result = { ...record }
  for (const key of Object.keys(configSchema)) {
    if (configSchema[key].forceShow && result[key] === undefined) result[key] = null
  }
  return result
}

/** Preserve API-schema first, display-schema second redaction for every entry point. */
export function redactConfigCardRecord(source: Record<string, any>, schema: Record<string, any> | undefined, configSchema: ConfigurationSchema): Record<string, any> {
  const { redactByApiSchema, redactByConfigSchema, getApiSchemaField, isObjectRecord } = useHelpers()
  let result = source
  if (isObjectRecord(source) && Array.isArray(schema?.fields)) {
    result = Object.fromEntries(Object.entries(source).map(([key, value]) => {
      const field = getApiSchemaField(schema.fields, key)
      return [key, field ? redactByApiSchema(value, field) : value]
    }))
  }
  return redactByConfigSchema(result, configSchema) as Record<string, any>
}
