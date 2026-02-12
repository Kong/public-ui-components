import { computed, toValue } from 'vue'
import { marked } from 'marked'
import { SHARED_LABEL_ATTRIBUTES } from './constants'
import * as utils from '../utils'

import type { ArrayFieldSchema, ArrayLikeFieldSchema, FormSchema, RecordFieldSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'
import type { LabelAttributes, SelectItem } from '@kong/kongponents'
import type { MaybeRefOrGetter } from 'vue'

// Construct a map of all fields in a schema, with their full paths as keys
export function buildSchemaMap(schema: UnionFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  const recordSchema = (schema as RecordFieldSchema)
  if (Array.isArray(recordSchema.fields)) {
    Object.assign(schemaMap, buildRecordSchemaMap(recordSchema, pathPrefix))
  } else if (schema.type === 'array' && schema.elements) {
    Object.assign(schemaMap, buildArraySchemaMap(schema, pathPrefix))
  }

  return schemaMap
}

function buildRecordSchemaMap(recordSchema: RecordFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  if (Array.isArray(recordSchema.fields)) {
    for (const fieldDef of recordSchema.fields) {
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]
      const fieldPath = pathPrefix ? utils.resolve(pathPrefix, fieldName) : fieldName

      schemaMap[fieldPath] = fieldProps

      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        const subMap = buildRecordSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const subMap = buildArraySchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      }
    }
  }
  return schemaMap
}

function buildArraySchemaMap(arraySchema: ArrayFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  if (arraySchema.elements) {
    const elementProps = arraySchema.elements
    const elementPath = utils.resolve(pathPrefix, utils.arraySymbol)
    schemaMap[elementPath] = elementProps

    if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
      const subMap = buildRecordSchemaMap(elementProps, elementPath)
      Object.assign(schemaMap, subMap)
    } else if (elementProps.type === 'array' && elementProps.elements) {
      const subMap = buildArraySchemaMap(elementProps, elementPath)
      Object.assign(schemaMap, subMap)
    }
  }
  return schemaMap
}

/**
 * 'a.0.b.1.c' => 'a.*.b.*.c'
 */
export function generalizePath(p: string) {
  const parts = utils
    .toArray(p)
    .map(node => /^\d+$/.test(node) ? utils.arraySymbol : node)
  return utils.resolve(...parts)
}

export function useSchemaHelpers(schema: MaybeRefOrGetter<FormSchema | UnionFieldSchema>) {
  const schemaValue = toValue(schema)

  const schemaMap = computed(() => {
    if (!schemaValue) {
      return {}
    }
    return buildSchemaMap(schemaValue)
  })

  /**
   * Retrieves a schema object by path
   * @param path Optional dot-notation path to a specific schema field
   * @returns The schema for the specified path or the root schema if no path provided
   */
  function getSchema(): FormSchema
  function getSchema<T extends UnionFieldSchema = UnionFieldSchema>(path: string): T | undefined
  function getSchema<T extends UnionFieldSchema = UnionFieldSchema>(path?: string): T | UnionFieldSchema | undefined {
    return path == null ? schemaValue : schemaMap.value?.[generalizePath(path)]
  }

  /**
   * Creates a default value for a field, respecting its schema definition
   * @param path Path to the field in dot notation (e.g., 'foo.bar')
   * @param force When true, forces creation of structure even for optional fields
   * @returns The default value for the field based on its schema
   */
  function createFieldDefault(path: string, force: boolean = false): any {
    const schema = getSchema(path)
    if (!schema) {
      return null
    }

    // Use explicit default if provided
    if (schema.default !== undefined) {
      return schema.default
    }

    // Create structures when forced or for required fields
    if (force || schema.required) {
      if (schema.type === 'record') {
        return createRecordDefault(schema, path)
      } else if (schema.type === 'array') {
        return []
      } else if (schema.type === 'map') {
        return {}
      } else {
        return null
      }
    }

    // Non-required fields default to null
    return null
  }

  /**
   * Creates a default object for a record schema
   * @param schema The record schema definition
   * @param path Current field path
   */
  function createRecordDefault(schema: any, path: string): Record<string, any> {
    const result: Record<string, any> = {}

    if (Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        const key = Object.keys(field)[0]
        const fieldPath = path ? `${path}.${key}` : key

        const value = createFieldDefault(fieldPath, false)
        if (value !== undefined) {
          result[key] = value
        }
      }
    }
    return result
  }

  /**
   * Gets the default value for a field or the entire form
   * @param path Optional path to a field
   * @returns Default value for the field or entire form
   */
  function getDefault(path?: string): any {
    if (path) {
      // For any specific path access, force creation of that field
      return createFieldDefault(path, true)
    } else {
      // For the entire form, respect required flags without forcing
      return createRecordDefault(getSchema(), '')
    }
  }

  function getLabelAttributes(fieldPath: string): LabelAttributes {
    const schema = getSchema(fieldPath)
    const info = schema?.description ? marked.parse(schema.description, { async: false }) : undefined
    return {
      ...SHARED_LABEL_ATTRIBUTES,
      'data-testid': `ff-label-${fieldPath}`,
      info,
    }
  }

  function getSelectItems(fieldPath: string): SelectItem[] {
    const schema = getSchema(fieldPath)
    return utils.toSelectItems((schema?.one_of || (schema as ArrayLikeFieldSchema).elements?.one_of || []))
  }

  function getPlaceholder(fieldPath: string): string | null {
    const schema = getSchema(fieldPath)
    const defaultValue = schema?.default

    let stringified = null

    if (schema?.type === 'foreign' && !!defaultValue?.id) {
      stringified = defaultValue.id
    } else if (defaultValue == null || typeof defaultValue === 'object' || defaultValue === '') {
      return null
    } else if (Array.isArray(defaultValue)) {
      if (defaultValue.length === 0) {
        return null
      }
      stringified = defaultValue.join(', ')
    } else {
      stringified = defaultValue.toString()
    }

    return `Default: ${stringified}`
  }

  function getSchemaMap() {
    return schemaMap.value
  }

  /**
   * Get empty value or default based on whether the field is required
   */
  function getEmptyOrDefault(path?: string): unknown {
    const schema = (getSchema as any)(path)
    const isRequired = schema?.required
    return isRequired ? getDefault(path) : null
  }

  return {
    getSchemaMap,
    getSchema,
    getDefault,
    getSelectItems,
    getLabelAttributes,
    getPlaceholder,
    getEmptyOrDefault,
  }
}
