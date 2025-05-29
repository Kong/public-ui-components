import type { JSONSchema } from 'vscode-json-languageservice'
import {
  type ArrayLikeFieldSchema,
  type BooleanFieldSchema,
  type FieldSchema,
  type LanguageServiceVariant,
  type LuaSchema,
  type MapFieldSchema,
  type NumberLikeFieldSchema,
  type RecordFieldSchema,
  type StringFieldSchema,
} from '../types'
import { regexFromLuaPattern } from '../utils'

export const isStringField = (schema: FieldSchema): schema is StringFieldSchema =>
  schema.type === 'string'

export const isNumberLikeField = (schema: FieldSchema): schema is NumberLikeFieldSchema =>
  schema.type === 'number' || schema.type === 'integer'

export const isBooleanField = (schema: FieldSchema): schema is BooleanFieldSchema =>
  schema.type === 'boolean'

export const isArrayLikeField = (schema: FieldSchema): schema is ArrayLikeFieldSchema =>
  schema.type === 'array' || schema.type === 'set'

export const isMapField = (schema: FieldSchema): schema is MapFieldSchema =>
  schema.type === 'map'

export const isRecordField = (schema: FieldSchema): schema is RecordFieldSchema =>
  schema.type === 'record'

export const buildStringSchema = (fieldSchema: StringFieldSchema): JSONSchema => {
  const schema: JSONSchema = {
    type: 'string',
  }

  if (fieldSchema.len_eq !== undefined) {
    schema.minLength = fieldSchema.len_eq
    schema.maxLength = fieldSchema.len_eq
  } else {
    schema.minLength = fieldSchema.len_min
    schema.maxLength = fieldSchema.len_max
  }

  if (fieldSchema.one_of !== undefined) {
    schema.enum = fieldSchema.one_of
  }

  const allOf: JSONSchema['allOf'] = []

  if (fieldSchema.match !== undefined) {
    allOf.push({
      pattern: regexFromLuaPattern(fieldSchema.match),
      $comment: 'source: match',
    })
  }

  if (fieldSchema.match_none) {
    allOf.push(
      ...fieldSchema.match_none.map((rule) => {
        const pattern = regexFromLuaPattern(rule.pattern)
        return {
          errorMessage: rule.err,
          not: {
            pattern,
          },
          $comment: 'source: match_none',
        }
      }),
    )
  }

  if (fieldSchema.match_any) {
    allOf.push({
      errorMessage: fieldSchema.match_any.err,
      anyOf: fieldSchema.match_any.patterns.map((pattern) => ({
        pattern: regexFromLuaPattern(pattern),
      })),
      $comment: 'source: match_any',
    })
  }

  if (fieldSchema.match_all) {
    allOf.push(
      ...fieldSchema.match_all.map((rule) => {
        const pattern = regexFromLuaPattern(rule.pattern)
        return {
          errorMessage: rule.err,
          pattern,
          $comment: 'source: match_all',
        }
      }),
    )
  }

  if (allOf.length > 0) {
    schema.allOf = allOf
  }

  return schema
}

export const buildNumberLikeSchema = (fieldSchema: NumberLikeFieldSchema): JSONSchema => {
  const schema: JSONSchema = {
    type: 'number',
  }

  schema.minimum = fieldSchema.between?.[0]
  schema.maximum = fieldSchema.between?.[1]

  if (typeof fieldSchema.gt === 'number' && !Number.isNaN(fieldSchema.gt)) {
    if (typeof schema.minimum !== 'number' || fieldSchema.gt > schema.minimum) {
      schema.minimum = fieldSchema.gt
    }
  }

  if (fieldSchema.one_of !== undefined) {
    schema.enum = fieldSchema.one_of
  }

  return schema
}

export const buildBooleanSchema = (fieldSchema: BooleanFieldSchema): JSONSchema => {
  return {
    type: 'boolean',
  }
}

export const buildArrayLikeSchema = (
  name: string,
  fieldSchema: ArrayLikeFieldSchema,
  languageService?: LanguageServiceVariant,
): JSONSchema => {
  const schema: JSONSchema = {
    type: 'array', // JSON schema does not have a specific type for "set"
    items: buildAnySchema(name, fieldSchema.elements, languageService),
  }

  if (typeof fieldSchema.len_min === 'number' && !Number.isNaN(fieldSchema.len_min)) {
    schema.minItems = fieldSchema.len_min
  }
  if (typeof fieldSchema.len_max === 'number' && !Number.isNaN(fieldSchema.len_max)) {
    schema.maxItems = fieldSchema.len_max
  }

  return schema
}

export const buildMapSchema = (fieldSchema: MapFieldSchema, languageService?: LanguageServiceVariant): JSONSchema => {
  const schema: JSONSchema = {
    type: 'object',
    additionalProperties: true,
  }

  const patternProperties: JSONSchema['patternProperties'] = {}
  if (isStringField(fieldSchema.keys) && fieldSchema.keys.match_none) {
    for (const rule of fieldSchema.keys.match_none) {
      patternProperties[regexFromLuaPattern(rule.pattern)] = { not: {} }
    }
  }
  patternProperties['.*'] = buildAnySchema('value', fieldSchema.values, languageService)
  schema.patternProperties = patternProperties

  if (typeof fieldSchema.len_min === 'number' && !Number.isNaN(fieldSchema.len_min)) {
    schema.minProperties = fieldSchema.len_min
  }
  if (typeof fieldSchema.len_max === 'number' && !Number.isNaN(fieldSchema.len_max)) {
    schema.maxProperties = fieldSchema.len_max
  }

  return schema
}

export const buildRecordSchema = (fieldSchema: RecordFieldSchema, languageService?: LanguageServiceVariant): JSONSchema => {
  const properties: Record<string, JSONSchema> = {}
  const required: string[] = []

  const schema: JSONSchema = {
    type: 'object',
    properties,
    // anyOf,
  }

  for (const namedChildField of fieldSchema.fields) {
    const [name, childField] = Object.entries(namedChildField)[0]
    properties[name] = buildAnySchema(name, childField, languageService)

    if (childField.required) {
      required.push(name)
    }
  }

  if (required.length > 0) {
    schema.required = required
  }

  // TODO: Try replace with allOf
  // let anyOf: JSONSchema[] | undefined
  // if (Array.isArray(fieldSchema.entity_checks)) {
  //   for (const check of fieldSchema.entity_checks) {
  //     if (isAtLeastOneOfEntityCheck(check)) {
  //       if (!anyOf) {
  //         anyOf = []
  //       }
  //       anyOf.push(...check.at_least_one_of.map((name) => ({ required: [name] })))
  //     }
  //   }
  // }

  return schema
}

export const buildAnySchema = (
  name: string,
  fieldSchema: FieldSchema,
  languageService?: LanguageServiceVariant,
): JSONSchema => {
  const sortText = `${fieldSchema.required ? ' ' : ''}${name}`

  const commons: JSONSchema = {
    // detail: `${fieldSchema.required ? '* ' : ''}${fieldSchema.type}`,
    default: fieldSchema.default,
    markdownDescription: [
      ...(fieldSchema.required ? ['_Required_'] : []),
      `Type: \`${fieldSchema.type}\``,
      fieldSchema.description,
      ...(fieldSchema.default ? [`Default: \`${JSON.stringify(fieldSchema.default)}\``] : []),
    ].join('\n\n'),
  }

  switch (languageService) {
    case 'yaml': {
      // Fields in the extended JSON schema are not identical between language services
      (commons as any).sortText = sortText
      break
    }
    // Default to the JSON language service
    case 'json':
    default: {
      commons.suggestSortText = sortText
      break
    }
  }

  // Not using helpers like `isStringField` here to exhaust all cases
  switch (fieldSchema.type) {
    case 'string':
      return { ...commons, ...buildStringSchema(fieldSchema as StringFieldSchema) }
    case 'number':
    case 'integer':
      return { ...commons, ...buildNumberLikeSchema(fieldSchema as NumberLikeFieldSchema) }
    case 'boolean':
      return { ...commons, ...buildBooleanSchema(fieldSchema as BooleanFieldSchema) }
    case 'array':
    case 'set':
      return { ...commons, ...buildArrayLikeSchema(name, fieldSchema as ArrayLikeFieldSchema, languageService) }
    case 'map':
      return { ...commons, ...buildMapSchema(fieldSchema as MapFieldSchema, languageService) }
    case 'record':
      return { ...commons, ...buildRecordSchema(fieldSchema as RecordFieldSchema, languageService) }
    case 'foreign':
    case 'function':
    case 'json':
      // TODO: Lack of fancy support for these types for now
      return commons
    default:
      throw new Error(`Unknown field schema with type "${fieldSchema.type}": ${JSON.stringify(fieldSchema)}`)
  }
}

export const buildLuaSchema = (luaSchema: LuaSchema, languageService?: LanguageServiceVariant): JSONSchema =>
  buildRecordSchema({ type: 'record', ...luaSchema }, languageService) // Lua schema is just a record field without `type`
