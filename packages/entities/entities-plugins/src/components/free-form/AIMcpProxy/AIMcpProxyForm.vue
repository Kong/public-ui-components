<template>
  <StandardLayout
    v-bind="props"
    :form-config="formConfig"
    :on-form-change="handleFormChange"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.default_acl'"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.default_acl_item_label', { index: index + 1 })"
          sticky-tabs
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.tools'"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.tool_item_label', { index: index + 1 })"
          sticky-tabs
        />
      </FieldRenderer>
    </template>

    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import { cloneDeep } from 'lodash-es'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import ArrayField from '../shared/ArrayField.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import ObjectField from '../shared/ObjectField.vue'
import { splitMapValues, joinMapValues } from './utils'
import composables from '../../../composables'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { FormConfig } from '../shared/types'
import type { AIMcpProxyPlugin } from './types'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = composables.useI18n()

function getScopesFromFormModel(): Record<string, any> {
  const data: Record<string, any> = {}
  const scopeModelFields = ['service-id', 'route-id', 'consumer-id', 'consumer_group-id']
  for (const field of scopeModelFields) {
    if (props.formModel[field]) {
      const name = field.split('-')[0]
      if (name) {
        data[name] = { id: props.formModel[field] }
      }
    }
  }
  return data
}

const formConfig: FormConfig<AIMcpProxyPlugin> = {
  hasValue: (data?: AIMcpProxyPlugin): boolean => !!data && Object.keys(data).length > 0,
  prepareFormData: (data: AIMcpProxyPlugin): AIMcpProxyPlugin => {
    const pluginConfig = cloneDeep(data)

    if (pluginConfig.config?.tools?.length) {
      pluginConfig.config.tools.forEach(tool => {
        joinMapValues(tool.headers)
        joinMapValues(tool.query)
      })
    }

    if (!props.isEditing) {
      return { ...pluginConfig, ...getScopesFromFormModel() } as AIMcpProxyPlugin
    }

    return pluginConfig
  },
}

function handleFormChange(value: Partial<AIMcpProxyPlugin>, fields?: string[]) {
  const pluginConfig = cloneDeep(value) as AIMcpProxyPlugin

  if (pluginConfig.config?.tools?.length) {
    pluginConfig.config.tools.forEach(tool => {
      splitMapValues(tool.headers)
      splitMapValues(tool.query)
    })
  }

  props.onFormChange(pluginConfig, fields)
}
</script>
