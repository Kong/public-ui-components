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
    :render-rules="renderRules"
    :schema="schema"
    tag="div"
    @change="handleDataChange"
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
    </template>

    <template
      v-if="$slots.default"
      #default
    >
      <slot />
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
import { computed, inject, useAttrs, useId, useTemplateRef } from 'vue'
import { pick } from 'lodash-es'
import Form from '../Form.vue'
import { normalizeMatch } from '../utils'
import type { FieldRenderer as PluginFieldRenderer, FormConfig } from '../types'
import FieldRenderer from '../FieldRenderer.vue'
import { REDIS_PARTIAL_INFO } from '../const'
import RedisSelector from '../RedisSelector.vue'
import { FIELD_RENDERERS, useSchemaExposer } from '../composables'
import type { PluginConfigurationBaseProps } from './provider'

defineOptions({ inheritAttrs: false })

const props = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
}>()

const attrs = useAttrs()
const instanceId = useId()
const formRef = useTemplateRef('form')

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)

const configFieldRenderers = computed<PluginFieldRenderer[]>(() => props.fieldRenderers ?? [])

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
})

useSchemaExposer(() => props.schema, instanceId)
</script>
