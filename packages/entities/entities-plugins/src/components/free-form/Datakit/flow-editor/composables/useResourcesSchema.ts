import { computed } from 'vue'
import { useFormShared } from '../../../shared/composables'
import type { RecordFieldSchema } from 'src/types/plugins/form-schema'
import { clone } from '../store/helpers'

export function useResourcesSchema() {
  const { getSchema } = useFormShared()

  return computed(() => {
    const schema = getSchema('config.resources')
    if (!schema) {
      throw new Error('Failed to get resource schema')
    }

    /**
     * Schema structure:
     * {
     *   fields: [
     *     { cache: {} },
     *     { vault: {} },
     *   ],
     *   type: 'record'
     * }
     */

    const originResourcesSchema = schema as RecordFieldSchema
    const enhancedResourcesSchema = clone(originResourcesSchema)

    // Enhance cache schema
    // Add partial_id fields
    enhancedResourcesSchema.fields.forEach(field => {
      const fieldName = Object.keys(field)[0]

      if (fieldName === 'cache') {
        const cacheField = field[fieldName] as RecordFieldSchema

        field[fieldName] = {
          ...cacheField,
          fields: [
            ...cacheField.fields,
            { partial_id: { type: 'string' } },
          ],
        } as RecordFieldSchema
      }
    })

    return enhancedResourcesSchema
  })
}
