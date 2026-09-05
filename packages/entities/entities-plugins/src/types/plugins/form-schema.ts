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

export interface MatchCondition {
  eq?: unknown
  not_eq?: unknown
  one_of?: unknown[]
  not_one_of?: unknown[]
  len_eq?: number
  len_not_eq?: number
  required?: boolean
  elements?: {
    type?: FieldSchemaType
    one_of?: unknown[]
    not_one_of?: unknown[]
  }
}

export type AtLeastOneOfEntityCheck = { at_least_one_of: string[] }

export type MutuallyRequiredEntityCheck = { mutually_required: string[] }

export type MutuallyExclusiveEntityCheck = { mutually_exclusive: string[] }

export type ConditionalEntityCheck = {
  conditional: {
    if_field: string
    if_match: MatchCondition
    then_field: string
    then_match: MatchCondition
    then_err?: string
  }
}

export type ConditionalAtLeastOneOfEntityCheck = {
  conditional_at_least_one_of: {
    if_field: string
    if_match: MatchCondition
    then_at_least_one_of: string[]
  }
}

/**
 * A check the Gateway evaluates with plugin-specific logic across several field
 * sources (e.g. rate-limiting-advanced validating `config` against
 * `expressions`). It names no individual fields, so the form has nothing to
 * render or act on and ignores it — declared here only so real schemas type-check.
 */
export type CustomEntityCheck = {
  custom_entity_check: {
    field_sources: string[]
    run_with_missing_fields?: boolean
  }
}

export type EntityCheck =
  | AtLeastOneOfEntityCheck
  | MutuallyRequiredEntityCheck
  | MutuallyExclusiveEntityCheck
  | ConditionalEntityCheck
  | ConditionalAtLeastOneOfEntityCheck
  | CustomEntityCheck

export interface FieldSchema {
  type: FieldSchemaType
  required?: boolean
  default?: any
  description?: string
  referenceable?: boolean

  one_of?: any[]

  help?: string

  entity_checks?: EntityCheck[]

  /**
   * The Gateway marks a field `expressible` when its value may alternatively be
   * supplied as an expression evaluated on every request, which takes priority
   * over the plain value. The expression itself lives in a twin field under the
   * schema's top-level `expressions` record — see {@link ExpressionFieldSchema}.
   */
  expressible?: boolean
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

/**
 * The twin of an {@link FieldSchema.expressible} field, found under the
 * top-level `expressions` record at the same relative path — `config.minute`
 * pairs with `expressions.minute`, and the elements of the array `config.limit`
 * pair with the elements of `expressions.limit`.
 *
 * It always holds the expression source as a string. `expressible_kong_type` is
 * the type the expression must evaluate to.
 *
 * Not a member of `UnionFieldSchema`: it is structurally a `string` field and is
 * rendered as one. The extra keys are read through this type where needed.
 */
export interface ExpressionFieldSchema extends StringFieldSchema {
  expressible_kong_type: FieldSchemaType
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

  encrypted?: boolean
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

export interface JsonFieldSchema extends FieldSchema {
  type: 'json'
  json_schema: any // Todo: Define a more specific type for JSON schema
}

export interface ForeignFieldSchema extends FieldSchema {
  type: 'foreign'
  reference: string
  default?: { id: string }
}

export type UnionFieldSchema = StringFieldSchema
  | NumberLikeFieldSchema
  | BooleanFieldSchema
  | ArrayFieldSchema
  | SetFieldSchema
  | MapFieldSchema
  | RecordFieldSchema
  | JsonFieldSchema
  | ForeignFieldSchema

export type NamedFieldSchema = { [name: string]: UnionFieldSchema }

export interface RecordFieldSchema extends FieldSchema {
  type: 'record'

  fields: NamedFieldSchema[]

  subschema_definitions?: NamedFieldSchema
  subschema_error?: string
  subschema_key?: string
  subschema_override_parent?: boolean
}

export interface FormSchema {
  fields: NamedFieldSchema[]
  type: 'record'
  supported_partials?: Record<string, string[]>
}
