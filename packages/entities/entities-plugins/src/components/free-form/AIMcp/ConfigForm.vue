<template>
  <Form
    class="ai-mcp-config-form"
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
      <template #tools="{ name }">
        <ArrayField
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp.tool_item_label', { index: index + 1 })"
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

import type { AIMcpPlugin } from './types'
import type { FormConfig } from '../shared/types'
import type { ConfigFormProps } from '../shared/PluginFormWrapper.vue'

defineProps<ConfigFormProps<AIMcpPlugin>>()

const emit = defineEmits<{
  change: [value: AIMcpPlugin]
}>()

const { i18n: { t } } = composables.useI18n()

const prepareFormData = (data: AIMcpPlugin): AIMcpPlugin => {
  const pluginConfig = cloneDeep(data)

  if (pluginConfig.config?.tools?.length) {
    pluginConfig.config.tools.forEach(tool => {
      joinMapValues(tool.headers)
      joinMapValues(tool.query)
    })
  }

  return pluginConfig
}

const hasValue = (data: AIMcpPlugin | undefined): boolean => {
  return !!data?.config
}

const formConfig: FormConfig<AIMcpPlugin> = {
  prepareFormData,
  hasValue,
}

const onChange = (newVal: AIMcpPlugin) => {
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

<style lang="scss" scoped>
.ai-mcp-config-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-100;
}
</style>
