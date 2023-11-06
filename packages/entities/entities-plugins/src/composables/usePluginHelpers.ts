import type { ConfigurationSchema } from '@kong-ui-public/entities-shared'
import { ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { PluginType } from '../types'

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

  const getPluginCards = (type: 'all' | 'visible' | 'hidden', plugins: PluginType[], pluginsPerRow: number) => {
    if (type === 'all') {
      return plugins
    } else if (type === 'visible') {
      return plugins.slice(0, pluginsPerRow)
    }

    return plugins.slice(pluginsPerRow)
  }

  const convertToDotNotation = (key: string) => {
    return key.replace(/-/g, '.')
  }
  // TODO: pull over unit tests for these two

  /**
   * Takes an object with dot notated keys (key.nested.values)
   * and returns an object with nested objects (key: { nested: values })
   * @param {Object} obj
   * @returns {Object}
   */
  const unFlattenObject = (obj: Record<string, any>) => {
    const result = {}

    // Loop object and reduce each key to build
    // nested structure
    for (const key in obj) {
      const keys = key.split('.')

      keys.reduce((acc: Record<string, any>, cur: string, curIdx: number) => {
        return acc[cur] ||
        // If current key in acc is the next
        // item in the split array (dot notation)
        // set its value
        (acc[cur] = isNaN(keys[curIdx + 1] as any)
          ? (keys.length - 1 === curIdx ? obj[key] : {})
          : [])
      }, result)
    }

    return result
  }

  /**
   * A method to easily check if an object is empty or not
   * @param {Object} obj object to check
   * @return {Boolean}
   */
  const isObjectEmpty = (obj: Record<string, any>) => {
    return Object.keys(obj).length === 0
  }

  /**
   * Remove id of dot notated foreign key if null
   * @param {string} key
   * @param {Object} model
   */
  const unsetNullForeignKey = (key: string, model: Record<string, any>) => {
    const keys = ['service.id', 'route.id', 'consumer.id', 'consumer_group.id']

    if (keys.indexOf(key) > -1 && model[key] === null) {
      delete model[key]
      model[key.replace('.id', '')] = null
    }
  }

  return {
    setFieldType,
    getPluginCards,
    convertToDotNotation,
    unFlattenObject,
    isObjectEmpty,
    unsetNullForeignKey,
  }
}
