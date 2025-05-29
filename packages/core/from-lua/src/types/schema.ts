export type FieldSchemaType =
  | 'string' // Input, Textarea, Select
  | 'number' // Input
  | 'integer' // Input
  | 'boolean' // Checkbox
  | 'foreign'
  | 'array' // Array
  | 'set' // Array
  | 'map' // Map
  | 'record' // Record
  | 'function' // Not used
  | 'json' // Not used

export type AtLeastOneOfEntityCheck = { at_least_one_of: string[] }

export type EntityCheck = AtLeastOneOfEntityCheck

export const isAtLeastOneOfEntityCheck = (check: EntityCheck): check is AtLeastOneOfEntityCheck =>
  Object.prototype.hasOwnProperty.call(check, 'at_least_one_of')

export type LanguageServiceVariant = 'json' | 'yaml'

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
  type: 'string'

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

export interface NumberLikeFieldSchema extends FieldSchema {
  type: 'number' | 'integer'

  one_of?: number[]

  between?: [min: number, max: number]
  gt?: number
}

export interface BooleanFieldSchema extends FieldSchema {
  type: 'boolean'

  one_of?: boolean[]
}

export interface ArrayLikeFieldSchema extends FieldSchema {
  type: 'array' | 'set'

  elements: FieldSchema
  len_min?: number
  len_max?: number
}

export interface MapFieldSchema extends FieldSchema {
  type: 'map'

  keys: FieldSchema
  values: FieldSchema
  len_min?: number
  len_max?: number
}

export interface RecordFieldSchema extends FieldSchema {
  type: 'record'

  fields: NamedFieldSchema[]
}

export interface FormSchema extends Record<string, any> {
  fields: NamedFieldSchema[]
}

export type LuaSchema = FormSchema
