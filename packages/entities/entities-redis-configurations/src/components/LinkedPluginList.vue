<template>
  <KTableData
    :cache-identifier="buildLinksCacheKey(partialId)"
    :fetcher="fetcher"
    :headers="headers"
    :pagination-attributes="{ totalCount, disablePageJump: true }"
  >
    <template #name="{ rowValue }">
      <PluginName :plugin-name="rowValue" />
    </template>

    <template #action-items="{ row }">
      <KDropdownItem @click="viewPlugin(row)">
        {{ t('actions.view_plugin') }}
      </KDropdownItem>
    </template>
  </KTableData>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import composables from '../composables'
import PluginName from './PluginItem.vue'
import { useLinkedPluginsFetcher, buildLinksCacheKey } from '../composables/useLinkedPlugins'

import type { TableDataFetcherParams } from '@kong/kongponents'
import type { TableViewHeader } from '@kong/kongponents/dist/types'
import type { KonnectConfig, KongManagerConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import type { RedisConfigurationLinkedPlugin } from '../types'

const props = defineProps({
  config: {
    type: Object as PropType<KonnectConfig | KongManagerConfig>,
    required: true,
    validator: (config: KonnectConfig | KongManagerConfig) => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      return true
    },
  },
  partialId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'view-plugin', param: { id: string, plugin: string }): void
  (e: 'load', data: { total: number, data: RedisConfigurationLinkedPlugin[] }): void
}>()

const { i18n: { t } } = composables.useI18n()

const headers: TableViewHeader[] = [
  { key: 'name', label: t('linked_plugins_modal.headers.plugin') },
  { key: 'instance_name', label: t('linked_plugins_modal.headers.instance_name') },
  { key: 'actions', hideLabel: true },
]

const { fetcher: linksFetcher } = useLinkedPluginsFetcher(props.config)

const totalCount = ref(0)

const fetcher = async (param: TableDataFetcherParams): Promise<any> => {
  const { data } = await linksFetcher({
    partialId: props.partialId,
    size: param.pageSize,
    offset: param.offset,
  })

  totalCount.value = data.length // fixme(zehao): need total count from endpoint https://kongstrong.slack.com/lists/T0DS5NB27/F089F4H18HX?record_id=Rec08DNLCMTLH

  const result = {
    total: Number(data.length) || 0,
    data: data,
  }

  emit('load', result)

  return result
}

const viewPlugin = (row: any) => {
  emit('view-plugin', { id: row.id, plugin: row.name })
}
</script>
