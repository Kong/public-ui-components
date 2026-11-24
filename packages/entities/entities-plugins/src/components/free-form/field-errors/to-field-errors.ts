import { parseInvalidParameters } from './invalid-parameters'
import { parseKonnectErrors } from './konnect'

import type { FieldError } from '@kong-ui-public/freeform'
import type { FieldErrorContext, FieldErrorParser } from './types'

/**
 * The parsers to try, one per backend format. Each recognizes its own format by
 * the shape of the body, so the order doesn't matter. To support another backend
 * (e.g. the Kong Admin API, whose body has `fields`), add its parser here.
 */
const PARSERS: FieldErrorParser[] = [
  // Konnect core entities, e.g. plugins: `details[]`
  parseKonnectErrors,
  // Konnect APIs in the RFC 7807 style, e.g. AI Gateway: `invalid_parameters[]`
  parseInvalidParameters,
]

/**
 * Turns the body of an error response into the form's field errors, with paths
 * in the data path format the form takes.
 *
 * @param body The response body, e.g. `error.response.data`
 * @param context The schema and the submitted data, for backends that write some paths ambiguously
 * @returns `undefined` when no parser knows the format: show the error the old way
 */
export function toFieldErrors(body: unknown, context?: FieldErrorContext): FieldError[] | undefined {
  for (const parse of PARSERS) {
    const errors = parse(body, context)
    if (errors) {
      return errors
    }
  }
  return undefined
}
