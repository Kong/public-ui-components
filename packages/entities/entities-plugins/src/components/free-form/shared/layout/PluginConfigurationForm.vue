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

    <slot name="before" />

    <EntityFormBlock
      v-if="showPluginConfiguration"
      data-testid="form-section-plugin-config"
      :description="pluginConfigDescription ?? t('plugins.form.sections.plugin_config.description')"
      :step="pluginConfigStep"
      :title="pluginConfigTitle ?? t('plugins.form.sections.plugin_config.title')"
    >
      <slot />

      <template
        v-if="slots['plugin-config-title']"
        #title
      >
        <slot name="plugin-config-title" />
      </template>

      <template
        v-if="slots['plugin-config-description']"
        #description
      >
        <slot name="plugin-config-description" />
      </template>

      <template
        v-if="slots['plugin-config-extra']"
        #extra
      >
        <slot name="plugin-config-extra" />
      </template>
    </EntityFormBlock>

    <slot name="after" />
  </Form>
</template>

<script lang="ts">
export interface Props<T extends Record<string, any> = Record<string, any>> extends PluginConfigurationBaseProps<T> {
  pluginConfigStep?: number
  showPluginConfiguration?: boolean
  controlledFields: string[]
  prepareFormData?: (data: Partial<T>) => Partial<T>
}
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, inject, useAttrs, useId, useSlots, useTemplateRef } from 'vue'
import { EntityFormBlock } from '@kong-ui-public/entities-shared'
import { pick } from 'lodash-es'
import Form from '../Form.vue'
import { normalizeMatch } from '../utils'
import type { FieldRenderer as PluginFieldRenderer, FormConfig } from '../types'
import FieldRenderer from '../FieldRenderer.vue'
import { REDIS_PARTIAL_INFO } from '../const'
import RedisSelector from '../RedisSelector.vue'
import { FIELD_RENDERERS, useSchemaExposer } from '../composables'
import useI18n from '../../../../composables/useI18n'
import type { PluginConfigurationBaseProps } from './provider'

defineOptions({ inheritAttrs: false })

const {
  pluginConfigStep = 1,
  showPluginConfiguration = true,
  ...props
} = defineProps<Props<T>>()

const emit = defineEmits<{
  change: [value: T]
}>()

const attrs = useAttrs()
const slots = useSlots()
const instanceId = useId()
const formRef = useTemplateRef<any>('form')

const { i18n: { t } } = useI18n()
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
  return pick(props.model, props.controlledFields as string[]) as Partial<T>
})

function handleDataChange(value: T) {
  emit('change', value)
  props.onFormChange(value, props.controlledFields as string[])
}

defineExpose({
  getValue: () => formRef.value?.getValue(),
  setValue: (value: T) => formRef.value?.setValue(value),
})

useSchemaExposer(() => props.schema, instanceId)
</script>
