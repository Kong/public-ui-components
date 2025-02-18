<template>
  <KTableData
    :fetcher="fetcher"
    :headers="headers"
    :pagination-attributes="{ totalCount: tableData.length, disablePageJump: true }"
  >
    <template #name="{ rowValue }">
      <PluginName :plugin-name="rowValue" />
    </template>

    <template #action-items="{ row }">
      <KDropdownItem @click="() => $emit('view-plugin', row.id)">
        {{ t('actions.view_plugin') }}
      </KDropdownItem>
    </template>
  </KTableData>
</template>

<script setup lang="ts">
import composables from '../composables'
import PluginName from './PluginItem.vue'

import type { TableViewHeader } from '@kong/kongponents/dist/types'
import type { RedisConfigurationLinkedPlugin } from '../types'

defineProps({
  redisConfigurationId: {
    type: String,
    required: true,
  },
})

defineEmits<{
  (e: 'view-plugin', pluginId: string): void
}>()

const { i18n: { t } } = composables.useI18n()

const headers: TableViewHeader[] = [
  { key: 'name', label: t('linked_plugins_modal.headers.plugin') },
  { key: 'actions', hideLabel: true },
]

const tableData: RedisConfigurationLinkedPlugin[] = [
  { name: 'rate-limiting-advanced', instance_name: 'my-rla-1', id: '90ffda46-273c-4c20-8ad5-2b7a169c1818' },
  { name: 'rate-limiting', instance_name: 'my-rla-1', id: '62dc8be8-c75a-4211-ad41-ff4f3b6caacb' },
]

const fetcher = async (): Promise<any> => {
  // const { rows } = tableData.value

  // isLoading.value = false

  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    total: Number(tableData.length) || 0,
    data: tableData,
  }
}
</script>
