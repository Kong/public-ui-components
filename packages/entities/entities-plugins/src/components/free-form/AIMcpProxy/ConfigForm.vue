<template>
  <Form
    :config="formConfig"
    :data="data"
    :schema="schema"
    tag="div"
    @change="onChange"
  >
    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    >
      <template #default_acl="{ name }">
        <ArrayField
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.default_acl_item_label', { index: index + 1 })"
          :name="name"
          sticky-tabs
        />
      </template>
      <template #tools="{ name }">
        <ArrayField
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.tool_item_label', { index: index + 1 })"
          :name="name"
          sticky-tabs
        />
      </template>
    </ObjectField>
    <AdvancedFields />
  </Form>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import Form from '../shared/Form.vue'
import ArrayField from '../shared/ArrayField.vue'
import ObjectField from '../shared/ObjectField.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'
import { splitMapValues, joinMapValues } from './utils'
import composables from '../../../composables'

import type { AIMcpProxyPlugin } from './types'
import type { FormConfig } from '../shared/types'
import type { ConfigFormProps } from '../shared/PluginFormWrapper.vue'

defineProps<ConfigFormProps<AIMcpProxyPlugin>>()

const emit = defineEmits<{
  change: [value: AIMcpProxyPlugin]
}>()

const { i18n: { t } } = composables.useI18n()

const prepareFormData = (data: AIMcpProxyPlugin): AIMcpProxyPlugin => {
  const pluginConfig = cloneDeep(data)

  if (pluginConfig.config?.tools?.length) {
    pluginConfig.config.tools.forEach(tool => {
      joinMapValues(tool.headers)
      joinMapValues(tool.query)
    })
  }

  return pluginConfig
}

const hasValue = (data: AIMcpProxyPlugin | undefined): boolean => {
  return !!data?.config
}

const formConfig: FormConfig<AIMcpProxyPlugin> = {
  prepareFormData,
  hasValue,
}

const onChange = (newVal: AIMcpProxyPlugin) => {
  const pluginConfig = cloneDeep(newVal)

  if (pluginConfig.config?.tools?.length) {
    pluginConfig.config.tools.forEach(tool => {
      splitMapValues(tool.headers)
      splitMapValues(tool.query)
    })
  }

  emit('change', pluginConfig)
}
</script>
