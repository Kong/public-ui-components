<template>
  <KTableData
    :cache-identifier="buildLinksCacheKey(partialId)"
    :fetcher="fetcher"
    :headers="headers"
    :pagination-attributes="{ totalCount, disablePageJump: true }"
    :search-input="filterQuery"
  >
    <!-- Filter -->
    <template
      v-if="filterBarEnabled"
      #toolbar
    >
      <div class="toolbar-container">
        <EntityFilter
          v-model="filterQuery"
          :config="filterConfig"
        />
      </div>
    </template>

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
import { computed, ref } from 'vue'
import { EntityFilter } from '@kong-ui-public/entities-shared'

import composables from '../composables'
import PluginName from './PluginItem.vue'
import { useLinkedPluginsFetcher, buildLinksCacheKey } from '../composables/useLinkedPlugins'

import type { TableDataFetcherParams } from '@kong/kongponents'
import type { TableViewHeader } from '@kong/kongponents/dist/types'
import type {
  KonnectConfig,
  KongManagerConfig,
  ExactMatchFilterConfig,
  FuzzyMatchFilterConfig,
} from '@kong-ui-public/entities-shared'
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
  /**
   * Only works when filterBarEnabled is true
   */
  isExactMatch: {
    type: Boolean,
    default: false,
  },
  filterBarEnabled: {
    type: Boolean,
    default: false,
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
  const { data, count } = await linksFetcher({
    partialId: props.partialId,
    size: param.pageSize,
    offset: param.offset,
    query: param.query,
  })

  totalCount.value = count

  const result = {
    total: count,
    data: data,
  }

  emit('load', result)

  return result
}

const filterQuery = ref<string>('')
const filterConfig = computed<ExactMatchFilterConfig | FuzzyMatchFilterConfig>(() => {
  // todo(zehao): filter is not supported in BE yet
  const isExactMatch = (props.config.app === 'konnect' || props.isExactMatch)

  if (isExactMatch) {
    return {
      isExactMatch: true,
    } as ExactMatchFilterConfig
  }

  return {
    isExactMatch: false,
    fields: { name: { searchable: true } },
    schema: { name: { type: 'text' } },
  } as FuzzyMatchFilterConfig
})

const viewPlugin = (row: any) => {
  emit('view-plugin', { id: row.id, plugin: row.name })
}
</script>

<style scoped lang="scss">
.toolbar-container {
  align-items: center;
  display: flex;
  width: 100%;
}
</style>
