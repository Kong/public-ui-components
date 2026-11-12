import { getCelScope } from './cel-catalog'
import type { CelValidationRequest } from '../../../types/plugin-form'

/**
 * Which half of the endpoint's `one_of` body the field at `path` belongs to. The
 * `expressions.*` twins return their own field's type, so they go as `expression`;
 * every other CEL field in a plugin must return a boolean, so it goes as
 * `condition` — the plugin `condition` itself and ACL `allow_when`/`deny_when`.
 */
export const getCelValidationRequest = (path: string, expression: string): CelValidationRequest =>
  getCelScope(path).expressible ? { expression } : { condition: expression }

/** A compiler error, placed in the source when the message says where it is. */
export interface CelCompileError {
  /** The message to show, with the source location and the compiler's prefix stripped. */
  message: string
  /** 1-based, from the compiler's `<input>:line:column`. Absent when it reported none. */
  line?: number
  /** 1-based. The compiler counts columns from 0, so this is its column plus one. */
  column?: number
}

/**
 * The location cel-go reports, as it reaches us through koko and the Gateway:
 * `kcel: compile: ERROR: <input>:1:5: undeclared reference to 'foo'`. The source
 * name is whatever the compiler was handed, so it is not always `<input>`.
 */
const LOCATION = /(?:^|\s)(?:ERROR:\s*)?<?[\w.-]*>?:(\d+):(\d+):\s*/

/**
 * Splits the location out of a compiler error so the editor can mark it. An
 * unparseable message is returned whole and marked on the first line — the text
 * still tells the user what is wrong.
 */
export const parseCelCompileError = (message: string): CelCompileError => {
  const text = message.trim()
  const match = LOCATION.exec(text)
  if (!match) return { message: text }

  const line = Number(match[1])
  const column = Number(match[2])
  // cel-go repeats the offending source and a caret under it; the first line is the error.
  const rest = text.slice(match.index + match[0].length).split('\n')[0].trim()
  if (!rest) return { message: text }

  return { message: rest, line, column: column + 1 }
}
