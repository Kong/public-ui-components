import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { ValidatorFn } from './basic'

type ValidationConfig = Record<string, ValidatorFn<unknown>>
type ValidatorInputType<T> = T extends ValidatorFn<infer U> ? U : never
type ValidatorInputGetter<T> = () => ValidatorInputType<T>
type ValidatorInputValueOrGetter<T> = ValidatorInputType<T> | ValidatorInputGetter<T>

export type FieldValidationMethods<T extends ValidatorFn<unknown>> = {
  handleChange: (value: ValidatorInputValueOrGetter<T>) => void
  handleBlur: (value: ValidatorInputValueOrGetter<T>) => void
  validate: (value: ValidatorInputValueOrGetter<T>) => void
  isValid: ComputedRef<boolean>
  error: ComputedRef<string | undefined>
}

type UseValidationManagerReturn<T extends ValidationConfig> = {
  readonly isValid: ComputedRef<boolean>
  readonly errorMap: Ref<{ [K in keyof T]?: string }>
  readonly fields: {
    readonly [K in keyof T]: FieldValidationMethods<T[K]>
  }
  validate: (data: { [K in keyof T]?: ValidatorInputValueOrGetter<T[K]> }) => { [K in keyof T]?: string }
  clearErrors: () => void
}

/**
 * Manages validation across multiple fields
 */
export function useValidationManager<T extends ValidationConfig>(
  config: T,
): UseValidationManagerReturn<T> {
  const errorMap = ref<{ [K in keyof T]?: string }>({})
  const isValid = computed(() =>
    Object.values(errorMap.value).every(error => !error),
  )

  const fields: Partial<UseValidationManagerReturn<T>['fields']> = {}

  Object.keys(config).forEach(<K extends keyof T>(key: K) => {
    const validator = config[key]

    const validateField = (valueOrGetter: ValidatorInputValueOrGetter<T[K]>) => {
      const actualValue = typeof valueOrGetter === 'function'
        ? (valueOrGetter as () => ValidatorInputType<T[K]>)()
        : valueOrGetter

      const error = validator(actualValue)
      errorMap.value[key] = error
      return error
    }

    const clearError = () => {
      errorMap.value[key] = undefined
    }

    const performValidation = (valueOrGetter: ValidatorInputValueOrGetter<T[K]>) => {
      clearError()
      return validateField(valueOrGetter)
    }

    fields[key] = {
      handleChange: performValidation,
      handleBlur: performValidation,
      validate: performValidation,
      isValid: computed(() => errorMap.value[key] === undefined),
      error: computed(() => errorMap.value[key]),
    }
  })

  function clearErrors() {
    errorMap.value = {}
  }

  function validate(data: { [K in keyof T]?: ValidatorInputValueOrGetter<T[K]> }) {
    for (const key of Object.keys(config)) {
      const valueOrGetter = data[key as keyof T]
      const actualValue = typeof valueOrGetter === 'function'
        ? (valueOrGetter as () => ValidatorInputType<T[keyof T]>)()
        : valueOrGetter

      fields[key as keyof T]?.validate(actualValue!)
    }
    return errorMap.value
  }

  return {
    isValid,
    errorMap: errorMap as Ref<{ [K in keyof T]?: string }>,
    fields: fields as UseValidationManagerReturn<T>['fields'],
    clearErrors,
    validate,
  }
}
