<template>
  <Form
    ref="form"
    v-bind="formAttrs"
    class="ff-plugin-configuration-form"
    :config="realFormConfig"
    :data="(formData as T)"
    :data-instance-id="instanceId"
    :data-plugin-name="pluginName"
    :data-testid="formTestId"
    :errors="fieldErrors?.enabled.value ? fieldErrors.errors.value : undefined"
    :render-rules="renderRules"
    :schema="finalSchema"
    tag="div"
    @change="handleDataChange"
    @update:errors="handleErrorsUpdate"
  >
    <template #[FIELD_RENDERERS]>
      <FieldRenderer
        v-for="(renderer, index) in configFieldRenderers"
        :key="`${pluginName}-${index}`"
        v-slot="slotProps"
        :match="normalizeMatch(renderer.match)"
      >
        <component
          :is="renderer.component"
          v-bind="{
            ...slotProps,
            ...((typeof renderer.propsOverrides === 'function')
              ? renderer.propsOverrides(slotProps)
              : renderer.propsOverrides) ?? {},
          }"
        />
      </FieldRenderer>

      <FieldRenderer :match="({ path }) => path === redisPartialInfo?.redisPath?.value">
        <RedisSelector :is-konnect-managed-redis-enabled="props.isKonnectManagedRedisEnabled ?? false" />
      </FieldRenderer>

      <slot name="field-renderers" />

      <FieldRenderer
        :component="ExpressionCelField"
        :match="({ schema }) => isExpressionFieldSchema(schema)"
      />
    </template>

    <template
      v-if="$slots.default"
      #default
    >
      <slot />
    </template>

    <!-- Not in the default slot: without one, the form renders every field itself -->
    <template #form-append>
      <ErrorSummary
        v-if="fieldErrors?.enabled.value"
        :errors="fieldErrors.errors.value"
        :schema="schema"
        :unmatched-errors="formRef?.unmatchedErrors"
        @reveal="(path: string) => formRef?.reveal(path)"
        @select="(error: FieldError) => formRef?.reveal(error.path)"
      />
    </template>
  </Form>
</template>

<script lang="ts">
export interface Props<T extends Record<string, any> = Record<string, any>> extends PluginConfigurationBaseProps<T> {
  controlledFields?: string[]
  prepareFormData?: (data: Partial<T>) => Partial<T>
}
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import '@kong-ui-public/freeform/style.css'
import '../reveal-adapters'
import { computed, inject, onBeforeUnmount, useAttrs, useId, useTemplateRef, watchEffect } from 'vue'
import { pick } from 'lodash-es'
import { Form, isExpressionFieldSchema, normalizeMatch, FieldRenderer, FIELD_RENDERERS, useSchemaExposer } from '@kong-ui-public/freeform'
import type { FieldError, FieldRendererRule, FormConfig, FormSchema } from '@kong-ui-public/freeform'
import { REDIS_PARTIAL_INFO } from '../const'
import { PLUGIN_FORM_FIELD_ERRORS } from '../field-errors'
import ExpressionCelField from './ExpressionCelField'
import RedisSelector from './RedisSelector.vue'
import ErrorSummary from './ErrorSummary.vue'
import { appendEntityChecksFromMetadata, convertConfigSetsToArrays, distributeEntityChecks } from '../schema-enhancement'
import type { PluginConfigurationBaseProps } from '../layout/provider'

defineOptions({ inheritAttrs: false })

const props = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
}>()

const attrs = useAttrs()
const instanceId = useId()
const formRef = useTemplateRef('form')

const redisPartialInfo = inject(REDIS_PARTIAL_INFO, undefined)

const configFieldRenderers = computed<FieldRendererRule[]>(() => props.fieldRenderers ?? [])

/**
 * The schema the form renders.
 *
 * Entity checks from the plugin metadata are appended and distributed to the level of
 * the fields they cover, so each check sits beside the fields it validates.
 *
 * `set` fields become arrays: freeform shows a set as tags (string elements) or as an
 * enum with no options (any other elements), so a set of records gets no item fields at
 * all. A Kong `set` value is a JSON array.
 */
const finalSchema = computed<FormSchema>(() => convertConfigSetsToArrays(
  distributeEntityChecks(appendEntityChecksFromMetadata(props.pluginName, props.schema)),
))

const formTestId = computed(() => attrs['data-testid'] ?? 'ff-plugin-configuration-form')

const formAttrs = computed(() => {
  const { 'data-testid': _, ...formAttrs } = attrs

  return formAttrs
})

const realFormConfig = computed(() => {
  const formConfig = props.formConfig as FormConfig<T> | undefined

  return {
    ...(formConfig ?? {}),
    hasValue: formConfig?.hasValue ?? ((data?: T): boolean => !!data && Object.keys(data).length > 0),
    prepareFormData: (data: T): Partial<T> => {
      const preparedData = formConfig?.prepareFormData?.(data) ?? data

      return props.prepareFormData?.(preparedData) ?? preparedData
    },
  }
})

const formData = computed(() => {
  if (!Array.isArray(props.controlledFields)) return props.model
  return pick(props.model, props.controlledFields)
})

function handleDataChange(value: T) {
  emit('change', value)
  props.onFormChange(value, props.controlledFields)
}

defineExpose({
  getValue: () => formRef.value?.getValue(),
  setValue: (value: T) => formRef.value?.setValue(value),
  getEmptyValue: () => formRef.value?.getEmptyValue(),
})

// The errors of a failed save, from the plugin form that saves this one (`usePluginFormFieldErrors`).
// This form shows them on the fields and lists them in the error summary; the plugin form
// reads its schema to parse them.
const fieldErrors = inject(PLUGIN_FORM_FIELD_ERRORS, undefined)

function handleErrorsUpdate(errors: FieldError[]) {
  if (fieldErrors) {
    fieldErrors.errors.value = errors
  }
}

if (fieldErrors) {
  watchEffect(() => {
    fieldErrors.schema.value = props.schema
  })
  onBeforeUnmount(() => {
    fieldErrors.schema.value = undefined
  })
}

useSchemaExposer(() => finalSchema.value, instanceId)
</script>
