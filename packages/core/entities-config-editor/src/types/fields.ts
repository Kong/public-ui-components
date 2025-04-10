export const FIELD_TYPES = {
  STRING: 'string', // Input, Textarea, Select
  NUMBER: 'number', // Input
  INTEGER: 'integer', // Input
  BOOLEAN: 'boolean', // Checkbox
  FOREIGN: 'foreign',
  ARRAY: 'array', // Array
  SET: 'set', // Array
  MAP: 'map', // Map
  RECORD: 'record', // Record
  FUNCTION: 'function', // not used
  JSON: 'json', // not used
} as const

export type FieldType = typeof FIELD_TYPES[keyof typeof FIELD_TYPES]

export interface FieldProps<V = any, S extends FieldSchema = FieldSchema> {
  name?: string
  schema: S
  value?: V

  /** DEBUGGING: An stack that contains the information of the parent fields */
  parentStack?: string[]
}

export interface FieldEmits<V = any> {
  (e: 'update-value', value: V): void
}

export type AtLeastOneOfEntityCheck = { at_least_one_of: string[] }

export type EntityCheck = AtLeastOneOfEntityCheck

export const isAtLeastOneOfEntityCheck = (check: EntityCheck): check is AtLeastOneOfEntityCheck =>
  Object.prototype.hasOwnProperty.call(check, 'at_least_one_of')

export interface FieldSchema {
  type: FieldType
  required?: boolean
  default?: any
  description?: string
  referenceable?: boolean

  one_of?: any[]

  help?: string

  entity_checks?: EntityCheck[]
}

export type NamedFieldSchema = { [name: string]: FieldSchema }

export interface StringFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.STRING

  one_of?: string[]

  len_eq?: number
  len_min?: number
  len_max?: number

  match?: string

  match_none?: {
    pattern: string
    err: string
  }[]

  match_all?: {
    pattern: string
    err: string
  }[]

  match_any?: {
    patterns: string[]
    err: string
  }

  pattern?: string
}

export const isStringField = (schema: FieldSchema): schema is StringFieldSchema =>
  schema.type === FIELD_TYPES.STRING

export interface NumberLikeFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.NUMBER | typeof FIELD_TYPES.INTEGER

  one_of?: number[]

  between?: [min: number, max: number]
  gt?: number
}

export const isNumberLikeField = (schema: FieldSchema): schema is NumberLikeFieldSchema =>
  schema.type === FIELD_TYPES.NUMBER || schema.type === FIELD_TYPES.INTEGER

export interface BooleanFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.BOOLEAN

  one_of?: boolean[]
}

export const isBooleanField = (schema: FieldSchema): schema is BooleanFieldSchema =>
  schema.type === FIELD_TYPES.BOOLEAN

export interface ArrayLikeFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.ARRAY | typeof FIELD_TYPES.SET

  elements: FieldSchema
  len_min?: number
  len_max?: number
}

export const isArrayLikeField = (schema: FieldSchema): schema is ArrayLikeFieldSchema =>
  schema.type === FIELD_TYPES.ARRAY || schema.type === FIELD_TYPES.SET

export interface MapFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.MAP

  keys: FieldSchema
  values: FieldSchema
  len_min?: number
  len_max?: number
}

export const isMapField = (schema: FieldSchema): schema is MapFieldSchema =>
  schema.type === FIELD_TYPES.MAP

export interface RecordFieldSchema extends FieldSchema {
  type: typeof FIELD_TYPES.RECORD

  fields: NamedFieldSchema[]
}

export const isRecordField = (schema: FieldSchema): schema is RecordFieldSchema =>
  schema.type === FIELD_TYPES.RECORD

export interface FormSchema extends Record<string, any> {
  fields: NamedFieldSchema[]
}

/** Lua schema is a subset of RecordFieldSchema */
export type LuaSchema = RecordFieldSchema
