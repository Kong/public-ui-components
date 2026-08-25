/** A single validation failure, before it's mapped to any source location. */
export interface ValidationIssue {
  message: string
  path: PropertyKey[]
  /**
   * A short machine-readable code for the kind of failure, when the
   * underlying validator provides one (e.g. Zod's issue `code`, such as
   * `invalid_type` or `too_big`). Left undefined by validators that don't
   * have an equivalent concept.
   */
  code?: string
}

/**
 * Validates an already-parsed value and reports any issues. Knows nothing
 * about the model it came from, the language it was written in, which
 * validation library (if any) produced it, or how to turn an issue into a
 * source location - see `languages/*` for that, and e.g. `zod-validation.ts`
 * for a validator-specific adapter into this shape.
 */
export type ValidateFn = (value: unknown) => ValidationIssue[] | Promise<ValidationIssue[]>

/**
 * Merges multiple {@link ValidateFn}s into a single one that runs them all
 * and concatenates their issues.
 */
export function collectValidators(validators: ValidateFn[]): ValidateFn {
  return async (value) => {
    const results = await Promise.all(validators.map((validate) => validate(value)))
    return results.flat()
  }
}
