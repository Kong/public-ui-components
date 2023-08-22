import type { ConfigurationSchema } from '@kong-ui-public/entities-shared'
import { ConfigurationSchemaType } from '@kong-ui-public/entities-shared'

export default function useHelpers() {
  const METHOD_KEYS = ['methods', 'logout_methods']

  /**
   * Check the schema record and determine the field type, then set the type in the existing schema.
   * @param existingSchema The schema to set the field type in
   * @param key The key for the field to determine the type of
   * @param record The schema record
   */
  const setFieldType = (existingSchema: ConfigurationSchema, key: string, record: Record<string, any>): void => {
    if (!existingSchema || !key || !record) {
      return
    }

    switch (record.type) {
      case 'boolean':
        existingSchema[key] = {
          type: ConfigurationSchemaType.BadgeStatus,
          ...existingSchema[key],
        }
        break

      case 'string':
        if (record.encrypted) {
          existingSchema[key] = {
            type: ConfigurationSchemaType.Redacted,
            ...existingSchema[key],
          }
        } else {
          existingSchema[key] = {
            type: ConfigurationSchemaType.Text,
            ...existingSchema[key],
          }
        }
        break

      case 'set':
        if (record.elements?.type === 'string') {
          existingSchema[key] = {
            type: ConfigurationSchemaType.BadgeTag,
            ...existingSchema[key],
          }
        }
        break

      case 'array':
        if (METHOD_KEYS.includes(key)) {
          existingSchema[key] = {
            type: ConfigurationSchemaType.BadgeMethod,
            ...existingSchema[key],
          }
        } else if (record.elements?.type === 'string') {
          if (record.encrypted) {
            existingSchema[key] = {
              type: ConfigurationSchemaType.RedactedArray,
              ...existingSchema[key],
            }
          } else {
            existingSchema[key] = {
              type: ConfigurationSchemaType.BadgeTag,
              ...existingSchema[key],
            }
          }
        } else if (record.elements?.type === 'record') {
          existingSchema[key] = {
            type: ConfigurationSchemaType.Json,
            ...existingSchema[key],
          }
        }
        break

      case 'record':
        existingSchema[key] = {
          type: ConfigurationSchemaType.Json,
          ...existingSchema[key],
        }
        break

      default:
        existingSchema[key] = {
          type: ConfigurationSchemaType.Text,
          ...existingSchema[key],
        }
        break
    }
  }

  return {
    setFieldType,
  }
}
