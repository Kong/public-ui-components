import useI18n from '../../../../../../composables/useI18n'

export type ValidatorFn<T = unknown> = (value: T) => undefined | string

export function isValidNumber(value: unknown): value is number {
  const num = Number(value)
  return !isNaN(num) && isFinite(num)
}

/**
 * Chains multiple validators and returns the first error encountered
 */
export function compose<T = unknown>(...validators: Array<ValidatorFn<T>>) {
  return function composedValidator(value: T): undefined | string {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return undefined
  }
}

export function notEmpty(templateVarOrString?: string | { fieldName: string }): ValidatorFn<unknown> {
  const { i18n: { t } } = useI18n()

  const getErrorMessage = () => {
    if (!templateVarOrString) return 'Field is required'
    if (typeof templateVarOrString === 'string') return templateVarOrString
    return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_empty', templateVarOrString)
  }

  return function validateNotEmpty(value: unknown): undefined | string {
    if (value == null) return getErrorMessage()
    if (typeof value === 'string' && value.trim() === '') return getErrorMessage()
    return undefined
  }
}

export function stringFormat(
  fmt: 'identifier' | 'url',
  templateVarOrString?: string | { fieldName: string },
): ValidatorFn<string> {
  const { i18n: { t } } = useI18n()

  return function validateStringFormat(value: string): undefined | string {
    if (value == null) return undefined

    switch (fmt) {
      case 'identifier': {
        const getErrorMessage = () => {
          if (!templateVarOrString) return 'Invalid identifier format'
          if (typeof templateVarOrString === 'string') return templateVarOrString
          return t('plugins.free-form.datakit.flow_editor.node_properties.errors.invalid_identifier_format', templateVarOrString)
        }
        return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value) ? undefined : getErrorMessage()
      }

      case 'url': {
        const getErrorMessage = () => {
          if (!templateVarOrString) return 'Invalid URL format'
          if (typeof templateVarOrString === 'string') return templateVarOrString
          return t('plugins.free-form.datakit.flow_editor.node_properties.errors.invalid_url_format')
        }

        try {
          new URL(value)
          return undefined
        } catch {
          return getErrorMessage()
        }
      }

      default:
        return undefined
    }
  }
}

export function stringLenRange(
  minLength = 0,
  maxLength = Infinity,
  templateVarOrString?: string | { fieldName: string },
): ValidatorFn<string> {
  const { i18n: { t } } = useI18n()

  return function validateStringLenRange(value: string): undefined | string {
    if (value == null) return undefined
    if (typeof value !== 'string') return undefined

    if (value.length < minLength || value.length > maxLength) {
      const getErrorMessage = () => {
        if (!templateVarOrString) return `Value must be between ${minLength} and ${maxLength} characters`
        if (typeof templateVarOrString === 'string') return templateVarOrString
        return t('plugins.free-form.datakit.flow_editor.node_properties.errors.string_len_range', {
          fieldName: templateVarOrString.fieldName,
          minLength,
          maxLength,
        })
      }
      return getErrorMessage()
    }

    return undefined
  }
}

export function isNumber(templateVarOrString?: string | { fieldName: string }): ValidatorFn<unknown> {
  const { i18n: { t } } = useI18n()

  return function validateIsNumber(value: unknown): undefined | string {
    if (!isValidNumber(value)) {
      const getErrorMessage = () => {
        if (!templateVarOrString) return 'Value must be a number'
        if (typeof templateVarOrString === 'string') return templateVarOrString
        return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_number', templateVarOrString)
      }
      return getErrorMessage()
    }
    return undefined
  }
}

export function numberFormat(
  fmt: 'float' | 'integer',
  templateVarOrString?: string | { fieldName: string },
): ValidatorFn<number | string | undefined> {
  const { i18n: { t } } = useI18n()

  return function validateNumberFormat(value: number | string | undefined): undefined | string {
    if (value == null) return undefined

    const isNumberErr = isNumber(templateVarOrString)(value)
    if (isNumberErr) return isNumberErr

    const num = Number(value)

    switch (fmt) {
      case 'float': {
        const getErrorMessage = () => {
          if (!templateVarOrString) return 'Invalid float format'
          if (typeof templateVarOrString === 'string') return templateVarOrString
          return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_float', templateVarOrString)
        }
        return Number.isFinite(num) ? undefined : getErrorMessage()
      }

      case 'integer': {
        const getErrorMessage = () => {
          if (!templateVarOrString) return 'Invalid integer format'
          if (typeof templateVarOrString === 'string') return templateVarOrString
          return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_integer', templateVarOrString)
        }
        return Number.isInteger(num) ? undefined : getErrorMessage()
      }

      default:
        return undefined
    }
  }
}

export function numberRange(
  min = -Infinity,
  max = Infinity,
  templateVarOrString?: string | { fieldName: string },
): ValidatorFn<number | string | undefined> {
  const { i18n: { t } } = useI18n()

  return function validateNumberRange(value: number | string | undefined): undefined | string {
    if (value == null) return undefined

    const isNumberErr = isNumber(templateVarOrString)(value)
    if (isNumberErr) return isNumberErr

    const num = Number(value)
    if (num < min || num > max) {
      const getErrorMessage = () => {
        if (!templateVarOrString) return `Value must be between ${min} and ${max}`
        if (typeof templateVarOrString === 'string') return templateVarOrString
        return t('plugins.free-form.datakit.flow_editor.node_properties.errors.number_range', {
          fieldName: templateVarOrString.fieldName,
          min,
          max,
        })
      }
      return getErrorMessage()
    }

    return undefined
  }
}
