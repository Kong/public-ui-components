import { computed, onBeforeUnmount, onMounted, watch, type ComputedRef } from 'vue'
import type { ValidatorFn } from './basic'
import { useValidationManager } from './manager'
import { useEditorStore } from '../../store/store'

/**
 * Configuration for node form validation
 * @template T - Record of field names to validator functions
 */
interface UseFormValidationOptions<T extends Record<string, ValidatorFn<any>>> {
  /** Validation configuration object - supports function form for dynamic validators */
  validationConfig: T | (() => T)
  /** Function to get validation data */
  getValidationData: () => Record<keyof T, any>
  /** Function to toggle node validity */
  toggleNodeValid: (isValid: boolean) => void
}

/**
 * Field handler for convenient error binding and event handling
 */
interface FieldHandler {
  onBlur: () => void
  onUpdate: () => void
  error: ComputedRef<boolean>
  errorMessage: ComputedRef<string>
}

/**
 * Return type for useNodeFormValidation
 * @template T - The validation configuration type
 */
interface UseFormValidationReturn<T extends Record<string, ValidatorFn<any>>> {
  /** Field validation methods and state */
  fields: ReturnType<typeof useValidationManager<T>>['fields']
  /** Overall validity state */
  isValid: ComputedRef<boolean>
  /** Manually trigger full validation */
  validateAll: () => Record<keyof T, string | undefined>
  /** Factory function to create field handlers */
  createFieldHandler: (fieldName: keyof T, onUpdate?: () => void) => FieldHandler
}

/**
 * Integrated validation management Hook for NodeForm components
 *
 * This composable consolidates all common validation logic including:
 * - Field validation configuration management
 * - Lifecycle integration (onMounted, onBeforeUnmount)
 * - Reactive validation monitoring
 * - Field error binding and event handling
 *
 * @template T - The validation configuration type
 * @param options - Validation configuration options
 * @returns Validation manager with reactive state and field methods
 *
 * @example
 * ```typescript
 * // Simple validation scenario
 * const { createFieldHandler } = useNodeFormValidation({
 *   validationConfig: {
 *     url: compose(notEmpty({ fieldName: 'URL' }), stringFormat('url')),
 *     timeout: compose(numberFormat('integer'), numberRange(0, 2147483646)),
 *   },
 *   getValidationData: () => ({
 *     url: formData.value.url,
 *     timeout: formData.value.timeout,
 *   }),
 *   toggleNodeValid,
 * })
 *
 * const urlHandler = createFieldHandler('url', () => setConfig('url'))
 */
export function useFormValidation<T extends Record<string, ValidatorFn<any>>>(
  options: UseFormValidationOptions<T>,
): UseFormValidationReturn<T> {
  const {
    validationConfig,
    getValidationData,
    toggleNodeValid,
  } = options

  const { skipValidation } = useEditorStore()

  // Resolve validation configuration (static or dynamic)
  const resolvedConfig = computed(() => {
    return typeof validationConfig === 'function'
      ? validationConfig()
      : validationConfig
  })

  // Create a reactive validation manager that updates when config changes
  const validationManager = computed(() => {
    return useValidationManager(resolvedConfig.value)
  })

  // Extract fields, validate function, and isValid from the manager
  const fields = computed(() => validationManager.value.fields)
  const isValid = computed(() => validationManager.value.isValid.value)

  /**
   * Perform validation for all fields
   * @returns Map of field names to error messages
   */
  function validateAll(): Record<keyof T, string | undefined> {
    const data = getValidationData()
    const errorMap = validationManager.value.validate(data)
    // Convert partial record to full record with undefined for missing keys
    const result: Record<keyof T, string | undefined> = {} as Record<keyof T, string | undefined>
    for (const key in resolvedConfig.value) {
      result[key] = errorMap[key]
    }
    return result
  }

  /**
   * Create a field handler with convenient error binding and event handling
   */
  function createFieldHandler(fieldName: keyof T, onUpdate?: () => void): FieldHandler {
    return {
      onBlur: () => {
        const data = getValidationData()
        const field = fields.value[fieldName]
        if (field) {
          field.handleBlur(data[fieldName])
        }
      },
      onUpdate: () => {
        const data = getValidationData()
        const field = fields.value[fieldName]
        if (field) {
          field.handleChange(data[fieldName])
        }
        onUpdate?.()
      },
      error: computed(() => {
        const field = fields.value[fieldName]
        return field ? !field.isValid.value : false
      }),
      errorMessage: computed(() => {
        const field = fields.value[fieldName]
        return field ? (field.error.value ?? '') : ''
      }),
    }
  }

  // Lifecycle integration: validation on mount
  onMounted(() => {
    if (skipValidation.value) {
      skipValidation.value = false
    } else {
      validateAll()
    }
  })

  // Lifecycle integration: validation before unmount
  onBeforeUnmount(async () => {
    // The node might be removed when unmount, so the validation logic should be wrapped by a try...catch
    try {
      const errorMap = validateAll()
      const hasErrors = Object.values(errorMap).filter(Boolean).length > 0
      toggleNodeValid(!hasErrors)
    } catch {
      // no ops
    }
  })

  // Reactive monitoring: watch validity changes and toggle node validity
  watch(() => isValid.value, toggleNodeValid, { immediate: true })

  return {
    fields: fields.value,
    isValid,
    validateAll,
    createFieldHandler,
  }
}
