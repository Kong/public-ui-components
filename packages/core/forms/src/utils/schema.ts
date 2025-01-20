import cloneDeep from 'lodash-es/cloneDeep'
import each from 'lodash-es/each'
import get from 'lodash-es/get'
import isFunction from 'lodash-es/isFunction'
import isObject from 'lodash-es/isObject'
import set from 'lodash-es/set'

// Create a new model by schema default values
export const createDefaultObject = (schema: any, obj: Record<string, any> = {}): Record<string, any> => {
  each(schema.fields, (field: any) => {
    if (get(obj, field.model) === undefined && field.default !== undefined) {
      if (isFunction(field.default)) {
        set(obj, field.model, field.default(field, schema, obj))
      } else if (isObject(field.default) || Array.isArray(field.default)) {
        set(obj, field.model, cloneDeep(field.default))
      } else set(obj, field.model, field.default)
    }
  })

  return obj
}

// Get a new model which contains only properties of multi-edit fields
export const getMultipleFields = (schema: any): any[] => {
  const res: any[] = []

  each(schema.fields, field => {
    if (field.multi === true) {
      res.push(field)
    }
  })

  return res
}

// Merge many models to one 'work model' by schema
export const mergeMultiObjectFields = (schema: any, objs: any): Record<string, any> => {
  const model: Record<string, any> = {}

  const fields = getMultipleFields(schema)

  each(fields, (field: any) => {
    let mergedValue: any
    let notSet = true
    const path = field.model

    each(objs, (obj: any) => {
      const val = get(obj, path)

      if (notSet) {
        mergedValue = val
        notSet = false
      } else if (mergedValue !== val) {
        mergedValue = undefined
      }
    })

    set(model, path, mergedValue)
  })

  return model
}

export const slugifyFormID = (schema: any, prefix: any = ''): string => {
  // Try to get a reasonable default id from the schema,
  // then slugify it.
  if (typeof schema.id !== 'undefined') {
    // If an ID's been explicitly set, use it unchanged
    return prefix + schema.id + ''
  } else {
    // Return the slugified version of either:
    return (
      prefix +
      (schema.inputName || schema.label || schema.model || '')
        // NB: This is a very simple, conservative, slugify function,
        // avoiding extra dependencies.
        .toString()
        .trim()
        .toLowerCase()
        // Spaces & underscores to dashes
        .replace(/ |_/g, '-')
        // Multiple dashes to one
        .replace(/-{2,}/g, '-')
        // Remove leading & trailing dashes
        .replace(/^-+|-+$/g, '')
        // Remove anything that isn't a (English/ASCII) letter, number or dash.
        .replace(/([^a-zA-Z0-9-]+)/g, '')
    )
  }
}

export const slugify = (name: any = ''): string => {
  // Return the slugified version of either:
  return (
    name
      // NB: This is a very simple, conservative, slugify function,
      // avoiding extra dependencies.
      .toString()
      .trim()
      // .toLowerCase()
      // Spaces to dashes
      .replace(/ /g, '-')
      // Multiple dashes to one
      .replace(/-{2,}/g, '-')
      // Remove leading & trailing dashes
      .replace(/^-+|-+$/g, '')
      // Remove anything that isn't a (English/ASCII) letter, number or dash.
      .replace(/([^a-zA-Z0-9-_/./:]+)/g, '')
  )
}
