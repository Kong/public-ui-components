import { buildSchemaMap, generalizePath } from '../../shared/composables'
import { resolve } from '../../shared/utils'
import { isEnumField, isTagField } from './schema-utils'
import { get } from 'lodash-es'
import type {
  FormSchema,
  NamedFieldSchema,
  UnionFieldSchema,
  ArrayFieldSchema,
  RecordFieldSchema,
} from '../../../../types/plugins/form-schema'

export type HandlerType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'array'
  | 'record'
  | 'map'
  | 'tag'
  | 'json'
  | 'foreign'

export interface FieldToFill {
  handlerType: HandlerType
  fieldKey: string
  fieldSchema: UnionFieldSchema
  value: any
}

export interface FillerContext {
  schemaMap: Record<string, UnionFieldSchema>
}

/**
 * Determine handler type from field schema
 */
export function getHandlerType(fieldSchema: UnionFieldSchema): HandlerType {
  if (isEnumField(fieldSchema)) return 'enum'

  switch (fieldSchema.type) {
    case 'string': return 'string'
    case 'number':
    case 'integer': return 'number'
    case 'boolean': return 'boolean'
    case 'array': return 'array'
    case 'record': return 'record'
    case 'map': return 'map'
    case 'set': return isTagField(fieldSchema) ? 'tag' : 'enum'
    case 'json': return 'json'
    case 'foreign': return 'foreign'
    default: throw new Error(`Unsupported field type: ${(fieldSchema as UnionFieldSchema).type}`)
  }
}

/**
 * Walk through fields and yield FieldToFill objects
 */
export function* walkFields(
  fields: NamedFieldSchema[],
  data: Record<string, any>,
  ctx: FillerContext,
  prefix: string = '',
): Generator<FieldToFill> {
  for (const field of fields) {
    const fieldName = Object.keys(field)[0]
    const fieldKey = prefix ? resolve(prefix, fieldName) : fieldName
    const fieldValue = get(data, fieldName)

    if (fieldValue === undefined) continue

    const path = generalizePath(fieldKey)
    const fieldSchema = ctx.schemaMap[path]

    if (!fieldSchema) {
      throw new Error(`Field schema for "${fieldKey}" not found in schema map`)
    }

    yield {
      handlerType: getHandlerType(fieldSchema),
      fieldKey,
      fieldSchema,
      value: fieldValue,
    }
  }
}

/**
 * Get item info for array iteration
 */
export function getArrayItemInfo(
  fieldKey: string,
  index: number,
  ctx: FillerContext,
): { itemKey: string, itemSchema: UnionFieldSchema } {
  const itemKey = resolve(fieldKey, String(index))
  const itemPath = generalizePath(itemKey)
  const itemSchema = ctx.schemaMap[itemPath]

  if (!itemSchema) {
    throw new Error(`Item schema for "${itemKey}" not found in schema map`)
  }

  return { itemKey, itemSchema }
}

/**
 * Check if array item is a record that needs recursive filling
 */
export function isRecordArrayItem(itemSchema: UnionFieldSchema): itemSchema is RecordFieldSchema {
  return itemSchema.type === 'record' && Array.isArray(itemSchema.fields)
}

/**
 * Create a filler context from schema
 */
export function createContext(schema: FormSchema): FillerContext {
  return {
    schemaMap: buildSchemaMap(schema),
  }
}

// Re-export types for convenience
export type { ArrayFieldSchema, RecordFieldSchema }
