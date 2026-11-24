import { upperFirst } from 'lodash-es'
import { parseDataPath, replaceByDictionary } from '@kong-ui-public/freeform'

import type { FormSchema, NamedFieldSchema, UnionFieldSchema } from '@kong-ui-public/freeform'

/** `redis_host` → `Redis host`, the way the form labels a field */
function toFieldLabel(name: string): string {
  return upperFirst(name.split('_').map(replaceByDictionary).join(' '))
}

function findField(fields: NamedFieldSchema[], name: string): UnionFieldSchema | undefined {
  return fields.find(field => name in field)?.[name]
}

/** The label of one segment; an item number joins the label before it */
interface LabelPart {
  text: string
  /** An array or set item, labeled `#n` after its array */
  item?: boolean
}

function getLabelParts(segments: string[], schema?: FormSchema): LabelPart[] {
  let current: UnionFieldSchema | FormSchema | undefined = schema
  return segments.map((segment) => {
    if (current?.type === 'array' || current?.type === 'set') {
      current = current.elements
      return { text: `#${Number(segment) + 1}`, item: true }
    }
    if (current?.type === 'map') {
      current = current.values
      return { text: JSON.stringify(segment) }
    }
    // A record field, or a segment the schema doesn't describe
    current = current?.type === 'record' ? findField(current.fields, segment) : undefined
    return { text: toFieldLabel(segment) }
  })
}

function joinLabelParts(parts: LabelPart[]): string {
  return parts.reduce((label, part) => {
    if (!label) return part.text
    return part.item ? `${label} ${part.text}` : `${label} › ${part.text}`
  }, '')
}

/**
 * A readable label for the field at a data path, in the style of the form's labels.
 *
 * - Record fields use their label: `config.redis.host` → `Redis › Host`.
 *   The leading `config` is left out, as the plugin form leaves it out of its labels.
 * - Array and set items add a 1-based number: `config.servers.0.port` → `Servers #1 › Port`.
 * - Map entries show their key in quotes: `config.headers.X-Limit` → `Headers › "X-Limit"`.
 *
 * Without a schema, or below a field the schema doesn't describe, each segment is
 * labeled as a record field.
 *
 * @param from A data path to label the field relative to, when the field is below it,
 * e.g. the record an error is on for the fields its message names:
 * `config.redis.host` from `config.redis` → `Host`
 * @returns `''` for the whole entity (an empty path), or the path itself when it is malformed
 */
export function getErrorLabel(path: string, schema?: FormSchema, from?: string): string {
  let segments: string[]
  try {
    segments = parseDataPath(path)
  } catch {
    return path
  }

  const parts = getLabelParts(segments, schema)

  let base: string[] = []
  try {
    base = from ? parseDataPath(from) : []
  } catch {
    // A malformed base: label from the root
  }
  if (base.length && base.length < segments.length && base.every((segment, index) => segment === segments[index])) {
    return joinLabelParts(parts.slice(base.length))
  }

  // Left out unless it is the whole path
  const first = segments[0] === 'config' && segments.length > 1 ? 1 : 0
  return joinLabelParts(parts.slice(first))
}
