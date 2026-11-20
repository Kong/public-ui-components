import { toDataPath } from './konnect'

import type { FieldError } from '@kong-ui-public/freeform'
import type { FieldErrorParser } from './types'

/** One entry of `invalid_parameters` in a Konnect API error response */
interface InvalidParameter {
  /** `''` for an error on the whole entity */
  field?: string
  reason?: string
}

function isInvalidParameter(parameter: unknown): parameter is InvalidParameter {
  return typeof parameter === 'object' && parameter !== null
}

/**
 * Parses the `invalid_parameters` of a Konnect API error response (RFC 7807), as
 * AI Gateway writes them:
 *
 * ```json
 * {
 *   "status": 400,
 *   "title": "Bad Request",
 *   "detail": "Invalid request",
 *   "invalid_parameters": [
 *     { "field": "config.allow[0]", "reason": "invalid value", "source": "body" },
 *     { "field": "", "reason": "at least one of these fields must be non-empty: 'config.minute', 'config.hour'", "source": "body" }
 *   ]
 * }
 * ```
 *
 * The fields are written the same way as in `details` (see `parseKonnectErrors`):
 * AI Gateway builds them from the same validation errors.
 */
export const parseInvalidParameters: FieldErrorParser = (body, context) => {
  const parameters = (body as { invalid_parameters?: unknown } | null)?.invalid_parameters
  if (!Array.isArray(parameters)) {
    return undefined
  }

  return parameters.filter(isInvalidParameter).flatMap((parameter): FieldError[] => {
    if (typeof parameter.reason !== 'string' || !parameter.reason) {
      return []
    }
    const path = parameter.field ? toDataPath(parameter.field, context) : ''
    return [{ path, message: parameter.reason }]
  })
}
