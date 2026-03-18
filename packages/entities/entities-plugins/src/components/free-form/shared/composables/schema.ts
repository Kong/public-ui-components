import { computed, toValue } from 'vue'
import { marked } from 'marked'
import * as utils from '../utils'

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

import type { ArrayFieldSchema, ArrayLikeFieldSchema, FormSchema, MapFieldSchema, RecordFieldSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'
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
  } else if (schema.type === 'map' && schema.values) {
    Object.assign(schemaMap, buildMapSchemaMap(schema as MapFieldSchema, pathPrefix))
  }

  return schemaMap
}

export function buildRecordSchemaMap(recordSchema: RecordFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
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
      } else if (fieldProps.type === 'map' && (fieldProps as MapFieldSchema).values) {
        const subMap = buildMapSchemaMap(fieldProps as MapFieldSchema, fieldPath)
        Object.assign(schemaMap, subMap)
      }
    }
  }
  return schemaMap
}

export function buildArraySchemaMap(arraySchema: ArrayFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
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
    } else if (elementProps.type === 'map' && (elementProps as MapFieldSchema).values) {
      const subMap = buildMapSchemaMap(elementProps as MapFieldSchema, elementPath)
      Object.assign(schemaMap, subMap)
    }
  }
  return schemaMap
}

export function buildMapSchemaMap(mapSchema: MapFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  const valuePath = utils.resolve(pathPrefix, utils.arraySymbol)
  schemaMap[valuePath] = mapSchema.values

  // Recurse into value schema if it has children
  if (mapSchema.values.type === 'record' && Array.isArray((mapSchema.values as RecordFieldSchema).fields)) {
    const subMap = buildRecordSchemaMap(mapSchema.values as RecordFieldSchema, valuePath)
    Object.assign(schemaMap, subMap)
  } else if ((mapSchema.values.type === 'array' || mapSchema.values.type === 'set') && (mapSchema.values as ArrayFieldSchema).elements) {
    const subMap = buildArraySchemaMap(mapSchema.values as ArrayFieldSchema, valuePath)
    Object.assign(schemaMap, subMap)
  } else if (mapSchema.values.type === 'map' && (mapSchema.values as MapFieldSchema).values) {
    const subMap = buildMapSchemaMap(mapSchema.values as MapFieldSchema, valuePath)
    Object.assign(schemaMap, subMap)
  }

  return schemaMap
}

/**
 * 'a.0.b.1.c' => 'a.*.b.*.c'
 * Only generalizes numeric segments (array indices). Use generalizePathWithSchemaMap
 * for schema-aware generalization that also handles map keys.
 */
export function generalizePath(p: string) {
  const parts = utils
    .toArray(p)
    .map(node => /^\d+$/.test(node) ? utils.arraySymbol : node)
  return utils.resolve(...parts)
}

/**
 * Schema-map-aware path generalization that handles both array indices and map keys.
 * Walks the path left-to-right, consulting the schema map at each level to determine
 * whether a segment is a static field name or a dynamic key (array index / map key).
 *
 * Examples:
 *   'config.myMap.someKey'           => 'config.myMap.*'
 *   'config.myMap.someKey.nested'    => 'config.myMap.*.nested'
 *   'config.servers.0.host'         => 'config.servers.*.host'
 */
export function generalizePathWithSchemaMap(
  fullPath: string,
  schemaMap: Record<string, UnionFieldSchema>,
): string {
  const segments = utils.toArray(fullPath)
  if (segments.length === 0) return fullPath

  const result: string[] = []

  for (const seg of segments) {
    const withLiteral = result.length
      ? utils.resolve(...result, seg)
      : seg
    const withWildcard = result.length
      ? utils.resolve(...result, utils.arraySymbol)
      : utils.arraySymbol

    if (withLiteral in schemaMap) {
      result.push(seg)
    } else if (withWildcard in schemaMap) {
      result.push(utils.arraySymbol)
    } else {
      // Fallback: numeric segments are always wildcards (array indices)
      result.push(/^\d+$/.test(seg) ? utils.arraySymbol : seg)
    }
  }

  return utils.resolve(...result)
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
    return path == null ? schemaValue : schemaMap.value?.[generalizePathWithSchemaMap(path, schemaMap.value)]
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
  function getEmptyOrDefault<T = unknown>(path?: string): T | null {
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
