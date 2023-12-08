import type { ValidationResult } from '@kong/entity-labels'

export interface Label {
  id: number | string
  key: string
  value: string
  errors?: {
    key: ValidationResult
    value: ValidationResult
  }
}
