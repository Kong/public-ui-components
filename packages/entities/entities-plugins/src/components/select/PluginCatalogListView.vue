<template>
  <KCard>
    <KTableView
      class="plugin-catalog-table"
      client-sort
      :data="paginatedData"
      :headers="headers"
      :page-size="10"
      :pagination="true"
      :pagination-attributes="{ totalCount: tableRows.length, currentPage: currentPage,
                                pageSizes: [10, 25, 50] }"
      resize-columns
      :row-key="'id'"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #name="{ row }">
        <span class="plugin-name-cell">
          <PluginIcon
            :name="row.plugin!.id"
            :size="20"
          />
          <span
            class="plugin-name-text"
            :title="row.name"
          >{{ row.name }}</span>
        </span>
      </template>
      <template #description="{ row }">
        <span
          class="plugin-description-cell"
          :title="row.description"
        >
          {{ row.description }}
        </span>
      </template>
      <template #action="{ row }">
        <div class="plugin-action-cell">
          <KButton
            appearance="tertiary"
            size="small"
            :to="props.config.getCreateRoute(row.id)"
          >
            {{ t('actions.configure') }}
          </KButton>
        </div>
      </template>
    </KTableView>
  </KCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../../composables'
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import {
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
} from '../../types'

const props = defineProps<{
  config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig
  pluginList?: PluginCardList
}>()

const { i18n: { t } } = composables.useI18n()

const headers = [
  { key: 'name', label: t('plugins.select.list.table_headers.name'), sortable: true },
  { key: 'description', label: t('plugins.select.list.table_headers.description') },
  { key: 'action', hideLabel: true },
]

const tableRows = computed(() => {
  if (!props.pluginList) return []
  const allPlugins = Object.values(props.pluginList).flat()
  const uniquePlugins = Array.from(
    new Map(allPlugins.map(plugin => [plugin!.id, plugin])).values(),
  )
  return uniquePlugins.map(plugin => ({
    id: plugin!.id,
    name: plugin!.name,
    description: plugin!.description,
    plugin,
  }))
})
const paginatedPageSize = ref<number>(10)
const currentPage = ref<number>(1)
const paginatedData = ref(tableRows.value.slice(0, paginatedPageSize.value))
const onPageChange = ({ page }: { page: number }) => {
  currentPage.value = page
  if (page === 1) {
    paginatedData.value = tableRows.value.slice(0, paginatedPageSize.value)
  } else {
    paginatedData.value = tableRows.value.slice((paginatedPageSize.value * (page - 1)), (paginatedPageSize.value * (page - 1)) + paginatedPageSize.value)
  }
}

const onPageSizeChange = ({ pageSize }: { pageSize: number }) => {
  paginatedPageSize.value = pageSize
  paginatedData.value = tableRows.value.slice((paginatedPageSize.value * (currentPage.value - 1)), (paginatedPageSize.value * (currentPage.value - 1)) + paginatedPageSize.value)
}
</script>

<style lang="scss" scoped>
.plugin-name-cell {
  align-items: center;
  display: flex;
}

.plugin-name-text {
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-description-cell {
  -webkit-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
}

.plugin-action-cell {
  display: flex;
  font-weight: $kui-font-weight-semibold;
  justify-content: flex-start;
  max-width: 100px;
  min-width: 100px;
  width: 100px;
}
</style>
