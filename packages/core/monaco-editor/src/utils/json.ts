import type { JSONPath } from 'jsonc-parser'

/**
 * Format a JSONPath into a string representation.
 *
 * e.g.,
 *
 * - `['users', 0, 'name']` becomes `users[0].name`
 * - `['users', 0, "first-name"]` becomes `users[0]['first-name']`
 *
 * @param keyPath - The JSONPath to format
 * @returns The string representation of the JSONPath
 */
export function formatJSONKeyPath(keyPath: JSONPath): string {
  let keyPathStr = ''

  for (let i = 0; i < keyPath.length; i++) {
    const segment = keyPath[i]

    if (typeof segment === 'number') {
      keyPathStr += `[${segment}]`
    } else {
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment)) {
        if (i > 0) keyPathStr += '.'
        keyPathStr += segment
      } else {
        const escaped = segment.replace(/'/g, "\\'")
        keyPathStr += `['${escaped}']`
      }
    }
  }

  return keyPathStr
}
