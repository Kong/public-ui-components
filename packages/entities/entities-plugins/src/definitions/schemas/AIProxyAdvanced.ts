import type { CommonSchemaFields } from '../../types/plugins/shared'

export const aiProxyAdvancedSchema: CommonSchemaFields = {
  // For the ai-proxy-advanced plugin, 'config-embeddings' and 'config-vectordb' fields are non-required
  // but they have nested fields that are required. If the nested fields are not provided, 'config-embeddings'
  // and 'config-vectordb' should be set to null in the payload.
  shamefullyTransformPayload: ({ originalModel, model, payload, schema }) => {
    const isDirty = (key: string) => {
      // if the field is required and the model value is not empty
      // the field is dirty
      if (schema[key]?.required && model[key]) {
        return true
      }

      // if the model value is the same as the original value
      // the field is not dirty
      if (originalModel[key] === model[key]) {
        return false
      }

      // if the original value is null, and the model value is not empty or NaN
      // the field is dirty
      if (originalModel[key] === null) {
        return model[key] !== '' && !Number.isNaN(model[key])
      }

      // if the original value is not null, and the model value is not the same as the original value
      // the field is dirty
      return true
    }

    const hasDirtyFields = (prefix: string) => Object.keys(originalModel)
      .some(key => key.startsWith(prefix) && isDirty(key))

    // If 'config-embeddings-*' fields are not dirty, set 'config-embeddings' to null in the payload
    if (!hasDirtyFields('config-embeddings')) {
      payload.config.embeddings = null
    }
    // If 'config-vectordb-*' fields are not dirty, set 'config-vectordb' to null in the payload
    if (!hasDirtyFields('config-vectordb')) {
      payload.config.vectordb = null
    }
  },
}
