import type { FieldError, FormSchema } from '@kong-ui-public/freeform'

/** What a parser may use to read paths a backend writes ambiguously */
export interface FieldErrorContext {
  /** The schema of the form that was submitted */
  schema?: FormSchema
  /** The data that was submitted, not the form's current data */
  data?: unknown
}

/**
 * Turns the body of an error response from one backend into the form's field errors.
 *
 * @returns `undefined` when the body is not in this backend's format, so the next
 * parser can try it
 */
export type FieldErrorParser = (body: unknown, context?: FieldErrorContext) => FieldError[] | undefined
