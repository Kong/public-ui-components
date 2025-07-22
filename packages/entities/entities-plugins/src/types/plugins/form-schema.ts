export type FieldSchemaType = 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'foreign'
  | 'array'
  | 'set'
  | 'map'
  | 'record'
  | 'function'
  | 'json'

export type AtLeastOneOfEntityCheck = { at_least_one_of: string[] }

export type EntityCheck = AtLeastOneOfEntityCheck

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

export interface StringFieldSchema extends FieldSchema {
  type: 'string'

  auto?: boolean

  encrypted?: boolean

  one_of?: string[]

  len_eq?: number
  len_min?: number
  len_max?: number

  match?: string

  match_none?: Array<{
    pattern: string
    err: string
  }>

  match_all?: Array<{
    pattern: string
    err: string
  }>

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

  elements: UnionFieldSchema
  len_min?: number
  len_max?: number
}

export interface ArrayFieldSchema extends ArrayLikeFieldSchema {
  type: 'array'
}

export interface SetFieldSchema extends ArrayLikeFieldSchema {
  type: 'set'
}

export interface MapFieldSchema extends FieldSchema {
  type: 'map'

  keys: UnionFieldSchema
  values: UnionFieldSchema
  len_min?: number
  len_max?: number
}

export type UnionFieldSchema = StringFieldSchema
  | NumberLikeFieldSchema
  | BooleanFieldSchema
  | ArrayFieldSchema
  | SetFieldSchema
  | MapFieldSchema
  | RecordFieldSchema

export type NamedFieldSchema = { [name: string]: UnionFieldSchema }

export interface RecordFieldSchema extends FieldSchema {
  type: 'record'

  fields: NamedFieldSchema[]
}

export interface FormSchema {
  fields: NamedFieldSchema[]
  type: 'record'
}
