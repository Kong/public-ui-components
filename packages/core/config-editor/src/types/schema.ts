export enum FieldSchemaType {
  String = 'string', // Input, Textarea, Select
  Number = 'number', // Input
  Integer = 'integer', // Input
  Boolean = 'boolean', // Checkbox
  Foreign = 'foreign',
  Array = 'array', // Array
  Set = 'set', // Array
  Map = 'map', // Map
  Record = 'record', // Record
  Function = 'function', // not used
  JSON = 'json', // not used
}

export interface FieldProps<V = any, S extends FieldSchema = FieldSchema> {
  name?: string
  schema: S
  value?: V

  /**
   * FOR DEBUGGING: An stack that contains the information of the parent fields
   */
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
  type: FieldSchemaType
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
  type: FieldSchemaType.String

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
  schema.type === FieldSchemaType.String

export interface NumberLikeFieldSchema extends FieldSchema {
  type: FieldSchemaType.Number | FieldSchemaType.Integer

  one_of?: number[]

  between?: [min: number, max: number]
  gt?: number
}

export const isNumberLikeField = (schema: FieldSchema): schema is NumberLikeFieldSchema =>
  schema.type === FieldSchemaType.Number || schema.type === FieldSchemaType.Integer

export interface BooleanFieldSchema extends FieldSchema {
  type: FieldSchemaType.Boolean

  one_of?: boolean[]
}

export const isBooleanField = (schema: FieldSchema): schema is BooleanFieldSchema =>
  schema.type === FieldSchemaType.Boolean

export interface ArrayLikeFieldSchema extends FieldSchema {
  type: FieldSchemaType.Array | FieldSchemaType.Set

  elements: FieldSchema
  len_min?: number
  len_max?: number
}

export const isArrayLikeField = (schema: FieldSchema): schema is ArrayLikeFieldSchema =>
  schema.type === FieldSchemaType.Array || schema.type === FieldSchemaType.Set

export interface MapFieldSchema extends FieldSchema {
  type: FieldSchemaType.Map

  keys: FieldSchema
  values: FieldSchema
  len_min?: number
  len_max?: number
}

export const isMapField = (schema: FieldSchema): schema is MapFieldSchema =>
  schema.type === FieldSchemaType.Map

export interface RecordFieldSchema extends FieldSchema {
  type: FieldSchemaType.Record

  fields: NamedFieldSchema[]
}

export const isRecordField = (schema: FieldSchema): schema is RecordFieldSchema =>
  schema.type === FieldSchemaType.Record

export interface FormSchema extends Record<string, any> {
  fields: NamedFieldSchema[]
}
