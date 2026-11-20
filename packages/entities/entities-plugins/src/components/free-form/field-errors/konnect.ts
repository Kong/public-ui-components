import { formatDataPath, parseDataPath } from '@kong-ui-public/freeform'

import type { FieldError, FormSchema, UnionFieldSchema } from '@kong-ui-public/freeform'
import type { FieldErrorContext, FieldErrorParser } from './types'

/** One entry of `details` in a Konnect error response (koko's `ErrorDetail`) */
interface KonnectErrorDetail {
  /** `ERROR_TYPE_FIELD`, `ERROR_TYPE_ENTITY` or `ERROR_TYPE_REFERENCE` */
  type?: string
  /** Absent for an error on the whole entity */
  field?: string
  messages?: string[]
}

/** The key Kong puts the errors of a record's own checks under */
const ENTITY_KEY = '@entity'

type Schema = FormSchema | UnionFieldSchema | undefined

function findField(schema: Schema, name: string): UnionFieldSchema | undefined {
  return schema?.type === 'record'
    ? schema.fields.find(field => name in field)?.[name]
    : undefined
}

function childData(data: unknown, key: string): unknown {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>)[key] : undefined
}

function hasKey(data: unknown, key: string): boolean {
  return typeof data === 'object' && data !== null && Object.prototype.hasOwnProperty.call(data, key)
}

const INDEX = /^\d+$/

/** Whether `segments` can be a path inside a value of `schema` */
function fits(segments: string[], schema: Schema): boolean {
  if (!segments.length) {
    return true
  }
  const [head, ...rest] = segments
  switch (schema?.type) {
    case 'record':
      return !!findField(schema, head) && fits(rest, findField(schema, head))
    case 'array':
    case 'set':
      return INDEX.test(head) && fits(rest, schema.elements)
    case 'map':
      return segments.some((_, i) => fits(segments.slice(i + 1), schema.values))
    case 'json':
      return true
    default:
      return false
  }
}

/**
 * Puts a map key back together. Konnect writes a key as it is, so `x.y` reads as
 * two segments. The key is the shortest run of segments that leaves a path the
 * map's values can hold, preferring a key that is in the submitted data: Konnect
 * validated that data, so the key is in it.
 *
 * - Values that are scalars hold no path, so the key takes every segment left.
 * - Values that are arrays hold only indexes, so the key takes the segments before them.
 * - Values that are records may hold field names, so the data tells the key apart.
 */
function splitMapKey(segments: string[], values: UnionFieldSchema, data: unknown): number {
  const fitting = segments
    .map((_, i) => i + 1)
    .filter(length => fits(segments.slice(length), values))
  return fitting.find(length => hasKey(data, segments.slice(0, length).join('.')))
    ?? fitting[0]
    ?? 1
}

/** Restores the map keys in `segments`, walking the schema and the submitted data */
function restoreMapKeys(segments: string[], schema: Schema, data: unknown): string[] {
  if (!segments.length) {
    return []
  }
  const [head, ...rest] = segments
  switch (schema?.type) {
    case 'record':
      return [head, ...restoreMapKeys(rest, findField(schema, head), childData(data, head))]
    case 'array':
    case 'set':
      return [head, ...restoreMapKeys(rest, schema.elements, childData(data, head))]
    case 'map': {
      const length = splitMapKey(segments, schema.values, data)
      const key = segments.slice(0, length).join('.')
      return [key, ...restoreMapKeys(segments.slice(length), schema.values, childData(data, key))]
    }
    default:
      // No schema, or a JSON field: nothing to restore
      return segments
  }
}

/**
 * Turns a Konnect field path into a data path. Konnect APIs that report errors in
 * `invalid_parameters` (e.g. AI Gateway) write the same paths.
 *
 * Konnect joins the segments with `.` and writes array indexes in brackets
 * (`config.callouts[1].name`). The errors of a record's own checks are listed
 * under `@entity` (`config.redis.@entity[0]`): they belong to the record.
 *
 * A map key is written as it is, so a key with a `.` in it looks like several
 * segments. With the schema and the submitted data, the key is put back together
 * (see `splitMapKey`); without them, each part is read as a segment.
 * A path that doesn't parse is kept as it is, so the form reports the error as unmatched.
 */
export function toDataPath(field: string, { schema, data }: FieldErrorContext = {}): string {
  let segments: string[]
  try {
    segments = parseDataPath(field)
  } catch {
    return field
  }

  const entityIndex = segments.indexOf(ENTITY_KEY)
  if (entityIndex !== -1) {
    segments = segments.slice(0, entityIndex)
  }
  return formatDataPath(restoreMapKeys(segments, schema, data))
}

function isErrorDetail(detail: unknown): detail is KonnectErrorDetail {
  return typeof detail === 'object' && detail !== null
}

/**
 * Parses a Konnect (koko) error response:
 *
 * ```json
 * {
 *   "code": 3,
 *   "message": "validation errors",
 *   "details": [
 *     { "type": "ERROR_TYPE_FIELD", "field": "config.allow[0]", "messages": ["invalid value"] },
 *     { "type": "ERROR_TYPE_ENTITY", "messages": ["at least one of these fields must be non-empty: 'config.minute', 'config.hour'"] }
 *   ]
 * }
 * ```
 *
 * Each message becomes one error. An entry without a field is on the whole entity,
 * so its path is `''`. Pass the schema and the submitted data in `context` to read
 * map keys with a `.` in them.
 */
export const parseKonnectErrors: FieldErrorParser = (body, context) => {
  const details = (body as { details?: unknown } | null)?.details
  if (!Array.isArray(details)) {
    return undefined
  }

  return details.filter(isErrorDetail).flatMap((detail): FieldError[] => {
    const path = detail.field ? toDataPath(detail.field, context) : ''
    const messages = Array.isArray(detail.messages) ? detail.messages : []
    return messages.map(message => ({ path, message }))
  })
}
