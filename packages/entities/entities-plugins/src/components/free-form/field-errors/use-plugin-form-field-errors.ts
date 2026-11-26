import { computed, provide, ref, shallowRef, toValue } from 'vue'
import { PLUGIN_FORM_FIELD_ERRORS } from './context'
import { toFieldErrors } from './to-field-errors'
import { getMessageParts } from '../message-fields'

import type { MaybeRefOrGetter } from 'vue'
import type { FieldError } from '@kong-ui-public/freeform'
import type { PluginFormFieldErrors } from './context'

/**
 * Shows the errors of a failed save on the fields of a plugin form. Call it in the
 * component that saves the form, above the layout: the layout's form
 * (`PluginConfigurationForm`) shows the errors on the fields and lists them in an
 * error summary.
 *
 * @param enabled Whether this form shows errors on the fields
 */
export function usePluginFormFieldErrors(enabled: MaybeRefOrGetter<boolean>) {
  const context: PluginFormFieldErrors = {
    enabled: computed(() => toValue(enabled)),
    errors: ref<FieldError[]>([]),
    schema: shallowRef(),
  }
  provide(PLUGIN_FORM_FIELD_ERRORS, context)

  /** Clears the errors, e.g. as the form is saved again */
  function clear() {
    context.errors.value = []
  }

  /**
   * Shows the errors of a failed save on the fields.
   *
   * @param body The body of the error response
   * @param data The data that was saved, to read map keys in the errors
   * @returns `false` when they can't be shown there: this form doesn't show them,
   * no form is mounted, or the response has no field errors in a known format.
   * Show one message instead.
   */
  function show(body: unknown, data: unknown): boolean {
    const schema = context.schema.value
    if (!context.enabled.value || !schema) {
      return false
    }
    const errors = toFieldErrors(body, { schema, data })
    if (!errors?.length) {
      return false
    }
    // An error that names fields, e.g. an entity check, is about those fields: it
    // goes once one of them changes, not as any field in its record does
    context.errors.value = errors.map((error) => {
      const fields = getMessageParts(error.message, error.path, schema).flatMap(part => part.path ?? [])
      return fields.length ? { ...error, fields } : error
    })
    return true
  }

  /** Whether this form shows errors on the fields, and has some: the error summary shows */
  const hasErrors = computed(() => context.enabled.value && context.errors.value.length > 0)

  return { clear, show, hasErrors }
}
