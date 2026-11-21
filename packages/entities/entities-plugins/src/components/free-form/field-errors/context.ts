import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { FieldError, FormSchema } from '@kong-ui-public/freeform'

/**
 * Shares the field errors of a failed save between the plugin form, which saves,
 * and the layout's form (`PluginConfigurationForm`), which shows them on the
 * fields and lists them in an error summary.
 */
export interface PluginFormFieldErrors {
  /** Whether the plugin form shows errors on the fields; otherwise it shows one message */
  enabled: Readonly<Ref<boolean>>
  errors: Ref<FieldError[]>
  /** The schema of the form that shows the errors, set while it is mounted */
  schema: ShallowRef<FormSchema | undefined>
}

export const PLUGIN_FORM_FIELD_ERRORS: InjectionKey<PluginFormFieldErrors> = Symbol('plugin-form-field-errors')
