import type { ValidationFn } from './types'

export function required(errorMsg?: string): ValidationFn<unknown> {
  return ({ value, name }) => {
    if (value == null || value === '') {
      return errorMsg || `"${name}" is required`
    }
    return undefined
  }
}
