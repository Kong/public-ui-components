import { parseDataPath } from '@kong-ui-public/freeform'

import type { FormSchema, UnionFieldSchema } from '@kong-ui-public/freeform'

/** A piece of an error message: text, or a field the message names */
export type MessagePart = { text: string, path?: never } | {
  /** The name as the message quotes it, without the quotes */
  text: string
  /** The data path of the field */
  path: string
}

type Schema = FormSchema | UnionFieldSchema | undefined

/** Whether the data path names a field of the schema */
function isField(path: string, schema: Schema): boolean {
  let segments: string[]
  try {
    segments = parseDataPath(path)
  } catch {
    return false
  }
  let current = schema
  for (const segment of segments) {
    switch (current?.type) {
      case 'record':
        current = current.fields.find(field => segment in field)?.[segment]
        break
      case 'array':
      case 'set':
        current = /^\d+$/.test(segment) ? current.elements : undefined
        break
      case 'map':
        current = current.values
        break
      default:
        return false
    }
  }
  return !!current
}

/** A single-quoted name, as Kong quotes the fields of an entity check */
const QUOTED = /'([^']+)'/g

/**
 * Splits an error message into text and the fields it names, so they can link
 * to the fields.
 *
 * Kong words its entity checks with fixed templates that quote the fields
 * (`at least one of these fields must be non-empty: 'minute', 'hour'`). It names
 * them as the check declares them, relative to the record it is declared on,
 * which is the record the error is on. A quoted name becomes a field only when
 * the schema has it, relative to that record or else from the root: a custom
 * check may quote a value instead.
 *
 * A linked name drops its quotes, as it shows as the field's label.
 *
 * @param message The error message
 * @param path The data path of the record the error is on (`''` for the whole entity)
 * @param schema The form's schema
 */
export function getMessageParts(message: string, path: string, schema?: FormSchema): MessagePart[] {
  if (!schema) {
    return [{ text: message }]
  }

  const parts: MessagePart[] = []
  let last = 0
  for (const match of message.matchAll(QUOTED)) {
    const name = match[1]
    const candidates = path ? [`${path}.${name}`, name] : [name]
    const fieldPath = candidates.find(candidate => isField(candidate, schema))
    if (!fieldPath) {
      continue
    }
    if (match.index > last) {
      parts.push({ text: message.slice(last, match.index) })
    }
    parts.push({ text: name, path: fieldPath })
    last = match.index + match[0].length
  }
  if (last < message.length) {
    parts.push({ text: message.slice(last) })
  }
  return parts
}
