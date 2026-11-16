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
 * @returns `''` for the whole entity (an empty path), or the path itself when it is malformed
 */
export function getErrorLabel(path: string, schema?: FormSchema): string {
  let segments: string[]
  try {
    segments = parseDataPath(path)
  } catch {
    return path
  }

  const parts: string[] = []
  let current: UnionFieldSchema | FormSchema | undefined = schema

  segments.forEach((segment, index) => {
    if (current?.type === 'array' || current?.type === 'set') {
      const itemNumber = Number(segment) + 1
      if (parts.length) {
        parts[parts.length - 1] += ` #${itemNumber}`
      } else {
        parts.push(`#${itemNumber}`)
      }
      current = current.elements
    } else if (current?.type === 'map') {
      parts.push(JSON.stringify(segment))
      current = current.values
    } else {
      // A record field, or a segment the schema doesn't describe
      if (!(index === 0 && segment === 'config' && segments.length > 1)) {
        parts.push(toFieldLabel(segment))
      }
      current = current?.type === 'record' ? findField(current.fields, segment) : undefined
    }
  })

  return parts.join(' › ')
}
