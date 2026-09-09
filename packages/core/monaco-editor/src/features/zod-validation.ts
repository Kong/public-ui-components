import type { z } from 'zod'
import type { ValidateFn } from './validation'

// Zod's stock `invalid_type` message is e.g. "Invalid input: expected
// string, received number" - the "Invalid input:" prefix is boilerplate
// that adds nothing ("expected string, received number" already says it),
// so it's dropped. Only stripped when something meaningful is left
// afterward - a bare "Invalid input" (no colon/suffix, e.g. an
// un-customized union failure) is kept as-is rather than becoming empty.
const INVALID_INPUT_PREFIX = /^Invalid input:\s*/

function cleanMessage(message: string): string {
  const stripped = message.replace(INVALID_INPUT_PREFIX, '')
  return stripped || message
}

/**
 * Adapts a Zod schema into a {@link ValidateFn}.
 */
export function createZodValidator(schema: z.ZodType): ValidateFn {
  return (value) => {
    const result = schema.safeParse(value)
    if (result.success) {
      return []
    }

    return result.error.issues.map((issue) => ({
      message: cleanMessage(issue.message),
      path: issue.path,
      code: issue.code,
    }))
  }
}
