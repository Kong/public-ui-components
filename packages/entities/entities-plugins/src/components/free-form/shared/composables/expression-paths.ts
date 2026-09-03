import * as utils from '../utils'

import type { ExpressionFieldSchema, FormSchema, RecordFieldSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'

/*
 * Pure path/schema helpers for the `expressions` convention.
 *
 * Separate from `expression.ts` so `form-context.ts` can use them: that module
 * is what `expression.ts` gets `useFormShared` from, so importing them from
 * there would close an import cycle. Nothing here touches form state.
 */

/**
 * Name of the root record holding the expression twins of `expressible` fields.
 */
export const EXPRESSIONS_FIELD = 'expressions'

/**
 * What a slot with no expression holds inside a twin *array*.
 *
 * The Gateway pairs a twin array with its source array by position — it pads a
 * short one with `''` and re-orders both together when it sorts the source — so
 * a slot has to keep its place. An empty string does that; the form's null
 * sentinel does not, and the array's string element schema has nowhere to put
 * it. Only for array elements: a scalar twin is unset with the usual sentinel.
 */
export const EXPRESSION_ARRAY_EMPTY = ''

/**
 * Whether anything inside a twin structure actually holds an expression.
 *
 * "No expression" is `''` for an array slot and null or absent for a scalar, so
 * a twin record built only from those is equivalent to having no `expressions`
 * at all — which is what lets a form that cleared every expression submit the
 * same shape as one that never had any.
 */
export function holdsExpression(value: unknown): boolean {
  if (typeof value === 'string') return value !== EXPRESSION_ARRAY_EMPTY
  if (Array.isArray(value)) return value.some(holdsExpression)
  if (value && typeof value === 'object') return Object.values(value).some(holdsExpression)
  return false
}

/**
 * Maps a field path to the path of its expression twin.
 *
 * The `expressions` record mirrors the structure of the top-level record its
 * expressible fields live in (`config`, for every plugin schema today), so the
 * twin path is the field path with its first segment swapped:
 *
 * @example
 * toExpressionPath('config.minute')   // => 'expressions.minute'
 * toExpressionPath('config.limit.0')  // => 'expressions.limit.0'
 * toExpressionPath('minute')          // => undefined — a root field has no twin
 */
export function toExpressionPath(path: string): string | undefined {
  const parts = utils.toArray(utils.removeRootSymbol(path))
  if (parts.length < 2) return undefined
  return utils.resolve(EXPRESSIONS_FIELD, ...parts.slice(1))
}

/**
 * Inverse of {@link toExpressionPath}: maps a twin's path back to the field it
 * overrides. Needs the source record's name, which the twin path cannot carry —
 * {@link findExpressionSourceRecord} recovers it from the schema.
 *
 * @example
 * toSourcePath('expressions.minute', 'config') // => 'config.minute'
 * toSourcePath('config.minute', 'config')      // => undefined — not a twin
 */
export function toSourcePath(path: string, sourceRecord: string): string | undefined {
  const parts = utils.toArray(utils.removeRootSymbol(path))
  if (parts[0] !== EXPRESSIONS_FIELD || parts.length < 2) return undefined
  return utils.resolve(sourceRecord, ...parts.slice(1))
}

/**
 * Name of the root record whose fields the `expressions` record mirrors — the
 * one declaring `expressible` fields. `config` for every plugin schema today,
 * read from the schema rather than assumed.
 */
export function findExpressionSourceRecord(
  schema: FormSchema | UnionFieldSchema | undefined,
): string | undefined {
  const fields = (schema as FormSchema | undefined)?.fields
  if (!Array.isArray(fields)) return undefined

  for (const field of fields) {
    const name = Object.keys(field)[0]
    if (name === EXPRESSIONS_FIELD) continue

    const record = field[name] as RecordFieldSchema | undefined
    if (record?.type !== 'record' || !Array.isArray(record.fields)) continue

    if (record.fields.some(child => child[Object.keys(child)[0]]?.expressible === true)) {
      return name
    }
  }

  return undefined
}

/**
 * Whether a schema is the expression twin of an `expressible` field.
 *
 * `expressible_kong_type` is the marker rather than the source field's
 * `expressible` flag, because the two do not always sit at the same path: for an
 * expressible *array* (rate-limiting-advanced's `config.limit`) the flag is on
 * the array while the twins are per element, so only the twin marks every path
 * that actually takes an expression.
 */
export function isExpressionFieldSchema(
  schema: UnionFieldSchema | undefined,
): schema is ExpressionFieldSchema {
  return !!schema && schema.type === 'string' && 'expressible_kong_type' in schema
}
