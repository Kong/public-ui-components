import type { ConfigurationSchema } from '@kong-ui-public/entities-shared'
import { ConfigurationSchemaType, useStringHelpers } from '@kong-ui-public/entities-shared'
import type PluginSelectCard from './../components/select/PluginSelectCard.vue'

export default function useHelpers() {
  const { capitalize } = useStringHelpers()

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

  const convertToDotNotation = (key: string) => {
    return key.replace(/-/g, '.')
  }

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
  * Delete all redis fields or partials in model and restore additional fields in model
  * This is used when redis partial is toggled
  * @param {Object} formModel
  * @param {Object} additionalModel
  * @param {string} fieldName
  * @returns {void}
  */
  const dismissField = (formModel: Record<string, any>, additionalModel: Record<string, any>, fieldName = 'redis') => {
    const redisFieldPattern = /(?<=config-redis-).*/
    if (typeof formModel !== 'object' || formModel === null) {
      return formModel
    }

    // delete all redis fields in model
    if (fieldName === 'redis') {
      Object.keys(formModel).forEach(key => {
        if (key.match(redisFieldPattern)) {
          delete formModel[key]
        }
      })
    } else {
      // remove partials field
      delete formModel[fieldName]
    }

    Object.assign(formModel, additionalModel)
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

  // _ gets converted to space and capitalize each word
  const formatPluginFieldLabel = (label: string) => {
    return capitalize(label.replace(/_/g, ' '))
  }

  /**
   * Get the height of the tallest card
   */
  const getTallestPluginCardHeight = (elements: Array<InstanceType<typeof PluginSelectCard>>): number => {
    let tallestCardHeight = 0

    if (elements.length) {
      for (let i = 0; i < elements.length; i++) {
        const card = elements[i].$el
        // find height of tallest card
        tallestCardHeight = card.offsetHeight > tallestCardHeight ? card.offsetHeight : tallestCardHeight
      }
    }

    return tallestCardHeight
  }

  /**
   * Determines the visibility of the collapse trigger
   * If the number of cards is greater than the number of columns displayed, show the trigger
   */
  const getToggleVisibility = (container: HTMLElement, childrenCount: number): boolean => {
    if (container && childrenCount) {
      const displayedColumns = window?.getComputedStyle(container)?.getPropertyValue('grid-template-columns')?.split(' ').length

      return childrenCount > displayedColumns
    }

    return true
  }

  return {
    setFieldType,
    convertToDotNotation,
    unFlattenObject,
    dismissField,
    isObjectEmpty,
    unsetNullForeignKey,
    formatPluginFieldLabel,
    getTallestPluginCardHeight,
    getToggleVisibility,
  }
}
