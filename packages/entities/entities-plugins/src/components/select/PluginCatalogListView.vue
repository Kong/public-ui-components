<template>
  <KCard data-testid="plugin-catalog-list-view-card">
    <KTableView
      :key="tableKey"
      class="plugin-catalog-table"
      client-sort
      :data="paginatedData"
      data-testid="plugin-catalog-list-view-table"
      :headers="headers"
      :pagination="true"
      :pagination-attributes="{ totalCount: tableRows.length, currentPage: currentPage,
                                initialPageSize: paginatedPageSize,
                                pageSizes: [10, 25, 50] }"
      resize-columns
      :row-key="'id'"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @sort="onSort"
    >
      <template #name="{ row }">
        <span
          class="plugin-name-cell"
          data-testid="plugin-catalog-list-view-name"
        >
          <PluginIcon
            :data-testid="`plugin-catalog-list-view-${row.plugin!.id}-icon`"
            :name="row.plugin!.id"
            :size="20"
          />
          <span
            class="plugin-name-text"
            data-testid="plugin-catalog-list-view-name-text"
            :title="row.name"
          >{{ row.name }}</span>
        </span>
      </template>
      <template #description="{ row }">
        <span
          class="plugin-description-cell"
          data-testid="plugin-catalog-list-view-description"
          :title="row.description"
        >
          {{ row.description }}
        </span>
      </template>
      <template #action="{ row }">
        <div
          class="plugin-action-cell"
          data-testid="plugin-catalog-list-view-action"
        >
          <KButton
            appearance="tertiary"
            data-testid="plugin-catalog-list-view-configure-btn"
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
import { computed, ref, watch } from 'vue'
import composables from '../../composables'
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import {
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
  type PluginCardList,
} from '../../types'

interface TableSortPayload {
  prevKey: string
  sortColumnKey: string
  sortColumnOrder: string
}

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
const tableKey = ref(0)
const paginatedPageSize = ref<number>(10)
const currentPage = ref<number>(1)
const sortedRows = ref(tableRows.value)

const paginatedData = computed(() => {
  const total = sortedRows.value.length
  const maxPage = Math.max(1, Math.ceil(total / paginatedPageSize.value))
  const safePage = Math.min(currentPage.value, maxPage)
  const start = (safePage - 1) * paginatedPageSize.value
  return sortedRows.value.slice(start, start + paginatedPageSize.value)
})

watch(tableRows, () => {
  sortedRows.value = [...tableRows.value]
  currentPage.value = 1
  tableKey.value++
})

const onPageChange = ({ page }: { page: number }) => {
  currentPage.value = page
}

const onPageSizeChange = ({ pageSize }: { pageSize: number }) => {
  paginatedPageSize.value = pageSize
  // paginatedData.value = tableRows.value.slice((paginatedPageSize.value * (currentPage.value - 1)), (paginatedPageSize.value * (currentPage.value - 1)) + paginatedPageSize.value)
}

const onSort = (sortPayload: TableSortPayload) => {
  const { sortColumnKey, sortColumnOrder } = sortPayload
  if (sortColumnKey !== 'name') {
    // only name column is sortable
    return
  }
  sortedRows.value = [...sortedRows.value].sort((a, b) => {
    const aValue = (a[sortColumnKey] || '').toLowerCase()
    const bValue = (b[sortColumnKey] || '').toLowerCase()
    if (aValue < bValue) return sortColumnOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortColumnOrder === 'asc' ? 1 : -1
    return 0
  })
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
  word-break: word-break;
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
