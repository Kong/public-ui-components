import type { ConfigurationSchema } from '@kong-ui-public/entities-shared'
import { ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type PluginSelectCard from './../components/select/PluginSelectCard.vue'

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
    getTallestPluginCardHeight,
    getToggleVisibility,
  }
}
