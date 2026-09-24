<template>
  <div
    class="top-n-data-grid"
    :style="gridStyle"
  >
    <TableDataGrid
      :error="!!presentation.errorMessage"
      :headers="headers"
      mode="unpaginated"
      :rows="rows"
      :table-config="tableConfig"
    >
      <template #error-state>
        <KEmptyState
          :action-button-visible="false"
          data-testid="chart-empty-state"
        >
          <template #icon>
            <WarningOutlineIcon />
          </template>
          <template #title>
            <p>{{ presentation.errorMessage }}</p>
          </template>
        </KEmptyState>
      </template>
      <template #empty-state>
        <KEmptyState
          :action-button-visible="false"
          data-testid="top-n-empty-state"
          :title="i18n.t('topNTable.defaultEmptyStateTitle')"
        />
      </template>
      <template
        v-for="header in dimensionHeaders"
        :key="header.key"
        #[header.key]="{ row }"
      >
        <AsyncEntityLink
          v-if="getEntityLink(header.key) && row[header.key] !== 'empty'"
          class="top-n-entity-link"
          :entity-link-data="presentation.getDimension(row, header.key)"
          :external-link="parseLink(row, header.key)"
        />
        <i v-else-if="presentation.getDimension(row, header.key).label === 'empty'">empty</i>
      </template>
    </TableDataGrid>
  </div>
</template>

<script setup lang="ts">
import type { AnalyticsBridge, ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import type { TableDataGridConfig } from '@kong-ui-public/table-data-grid'
import { computed, defineAsyncComponent, inject } from 'vue'
import { TableDataGrid } from '@kong-ui-public/table-data-grid'
import '@kong-ui-public/table-data-grid/dist/style.css'
import { WarningOutlineIcon } from '@kong/icons'
import composables from '../composables'
import { CP_ID_TOKEN, ENTITY_ID_TOKEN, INJECT_QUERY_PROVIDER } from '../constants'
import { createTopNGridRows, createTopNPresentation, type TopNGridRow } from '../utils/topn-columns'
import FallbackEntityLink from './FallbackEntityLink.vue'

const { chartOptions, data, fitToContent = false, height } = defineProps<{
  chartOptions: TopNTableOptions
  data: ExploreResultV4
  fitToContent?: boolean
  height?: number
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { i18n } = composables.useI18n()

// Derive rows once per response; a new array on every render would reset AG Grid's row data.
const rows = computed(() => createTopNGridRows(data))
const presentation = computed(() => createTopNPresentation({
  data,
  columnOptions: chartOptions.column_options,
  i18n,
}))
const headers = computed(() => presentation.value.headers.map(header => ({
  ...header,
  minWidth: header.type === 'dimension' ? 160 : header.bar ? 260 : 140,
})))
const dimensionHeaders = computed(() => presentation.value.headers.filter(header => header.type === 'dimension'))
const tableConfig = computed<TableDataGridConfig>(() => ({ fitToContent }))
const gridStyle = computed(() => fitToContent
  ? { height: 'auto' }
  : height === undefined ? undefined : { height: `${height}px` })

// EntityLink is an optional component -- it might be available, or it might not be.
// Attempt to fetch it from the analytics bridge.
// We don't use `loader` / `errorComponent` here because Vue treats not finding the
// component as an error, and spams the console accordingly.
const AsyncEntityLink = defineAsyncComponent(async () => {
  if (queryBridge?.fetchComponent) {
    try {
      return await queryBridge.fetchComponent('EntityLink')
    } catch {
      return FallbackEntityLink
    }
  }

  return FallbackEntityLink
})

const getMappedEntityLink = (dimension: string): string => {
  const entityLinks = chartOptions.entity_links

  if (!entityLinks) {
    return ''
  }

  return entityLinks[dimension] || Object.entries(entityLinks).find(([key]) => key.toLowerCase() === dimension.toLowerCase())?.[1] || ''
}

const getEntityLink = (dimension: string): string => {
  return getMappedEntityLink(dimension) || (dimensionHeaders.value[0]?.key === dimension ? chartOptions.entity_link || '' : '')
}

const parseLink = (row: TopNGridRow, dimension: string) => {
  const entityLink = getEntityLink(dimension)
  const id = String(row[dimension])

  if (id.includes(':')) {
    const [cpId, entityId] = id.split(':')
    return entityLink.replace(CP_ID_TOKEN, cpId).replace(ENTITY_ID_TOKEN, entityId)
  }

  return entityLink.replace(ENTITY_ID_TOKEN, id)
}
</script>

<style scoped lang="scss">
.top-n-data-grid {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;
}

.top-n-entity-link {
  min-width: 0;
  width: 100%;

  :deep(.entity-link),
  :deep(.k-popover) {
    max-width: 100%;
    min-width: 0;
  }

  :deep(.entity-link-label) {
    max-width: 100%;
  }
}
</style>
