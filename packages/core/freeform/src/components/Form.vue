<template>
  <component :is="tag">
    <component :is="slots[FIELD_RENDERERS]" />

    <slot>
      <Field
        v-for="field in childFields"
        :key="Object.keys(field)[0]"
        :name="Object.keys(field)[0]"
        @global-action="(name: GlobalAction, payload: any) => emit('globalAction', name, payload)"
      />
    </slot>
  </component>
</template>

<script lang="ts">
export type Props<T extends Record<string, any> = Record<string, any>> = {
  tag?: string
  schema: FormSchema | UnionFieldSchema
  data?: T
  config?: FormConfig<T>
  fieldsOrder?: string[]
  renderRules?: RenderRules
  /**
   * Errors to show on the fields, e.g. from the server rejecting a submit.
   * The form only shows them; when to set or clear them is up to the host.
   * Bind it with `v-model:errors`: when an array item or a map entry is
   * removed, or a map key renamed, the form emits the list with the errors
   * dropped or moved along, so none lands on another item.
   */
  errors?: FieldError[]
}
</script>

<script setup lang="ts" generic="T extends Record<string, any> = Record<string, any>">
import { useSlots, type Slot, computed, toRaw, toRef } from 'vue'
import { EXPRESSIONS_FIELD, FIELD_RENDERERS, provideFormShared } from '../composables'
import type { FormSchema, UnionFieldSchema } from '../form-schema'
import Field from './Field.vue'
import type { FieldError, FormConfig, GlobalAction, RenderRules } from '../types'
import { sortFieldsByBundles, sortFieldsByFieldNames } from '../utils'

defineOptions({ name: 'SchemaForm' })

defineSlots<
  {
    default?: Slot
    [FIELD_RENDERERS]?: Slot<{ name: string }>
  } & Partial<Record<string, Slot<{ name: string }>>>
>()

const { tag = 'form', schema, fieldsOrder, config, data, renderRules, errors } = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
  'globalAction': [name: GlobalAction, payload: any]
  'update:errors': [errors: FieldError[]]
}>()

const slots = useSlots()

const { getSchema, formData, setValue, getValue, rootRenderRules, getEmptyValue, reveal, unmatchedErrors } = provideFormShared({
  schema,
  propsData: computed(() => data as T),
  propsConfig: () => config as FormConfig,
  propsRenderRules: toRef(() => renderRules),
  propsErrors: () => errors,
  onErrorsChange: (value) => emit('update:errors', value),
  onChange: (value) => emit('change', value as T),
})

const childFields = computed(() => {
  const { fields } = getSchema()

  // The `expressions` record is a companion to its sibling top-level record,
  // not a field in its own right: each entry is rendered inline by the
  // expressible field it overrides (see `StringField`/`NumberField`).
  // Rendering it here as well would duplicate every one of those inputs.
  let sortedFields = fields.filter((field) => Object.keys(field)[0] !== EXPRESSIONS_FIELD)

  if (fieldsOrder) {
    return sortFieldsByFieldNames(sortedFields, fieldsOrder)
  }

  if (rootRenderRules.value?.bundles) {
    sortedFields = sortFieldsByBundles([...sortedFields], rootRenderRules.value.bundles)
  }

  return sortedFields
})


defineExpose({
  getValue,
  getRawValue: () => toRaw(formData),
  setValue,
  getEmptyValue,
  reveal,
  /**
   * The errors no field can show in the current state, see `createFieldErrors`
   */
  unmatchedErrors,
})
</script>

<style lang="scss">
// Not scoped: `reveal` puts the class on the field it lands on. A soft glow in
// a theme color comes off the field's edges and spreads out as it fades, with
// no hard line around the field.
@keyframes ff-reveal-highlight {
  from {
    filter: drop-shadow(0 0 4px var(--kui-color-brand, $kui-color-brand));
  }

  to {
    filter: drop-shadow(0 0 16px transparent);
  }
}

.ff-reveal-highlight {
  animation: ff-reveal-highlight var(--kong-ui-freeform-reveal-highlight-duration, 600ms) ease-out;
}
</style>
