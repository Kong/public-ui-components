<template>
  <div
    class="table-data-grid-renderer"
    :class="{ 'is-top-n': chartType === 'top_n' }"
    :style="rendererStyle"
  >
    <KSkeleton
      v-if="!queryReady || (chartType === 'top_n' && !queryBridge)"
      data-testid="table-skeleton"
      type="table"
    />
    <TableDataGrid
      v-else
      v-bind="gridProps"
      @state="onState"
    >
      <template
        v-if="chartType === 'top_n'"
        #error-state
      >
        <KEmptyState
          :action-button-visible="false"
          data-testid="chart-empty-state"
        >
          <template #icon>
            <VisibilityOffIcon v-if="queryError?.type === 'forbidden'" />
            <WarningOutlineIcon v-else />
          </template>
          <template #title>
            <p>{{ queryError?.message || presentation?.errorMessage || i18n.t('renderer.unexpectedError') }}</p>
          </template>
          <template
            v-if="queryError?.details"
            #default
          >
            <p>{{ queryError.details }}</p>
          </template>
        </KEmptyState>
      </template>
      <template
        v-if="chartType === 'top_n'"
        #empty-state
      >
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
          v-if="presentation && isTopNRow(row) && getEntityLink(header.key) && row[header.key] !== 'empty'"
          class="top-n-entity-link"
          :entity-link-data="presentation.getDimension(row, header.key)"
          :external-link="parseLink(row, header.key)"
        />
        <i v-else-if="isTopNRow(row) && presentation?.getDimension(row, header.key).label === 'empty'">empty</i>
      </template>
    </TableDataGrid>
  </div>
</template>
<script setup lang="ts">
import type { ChartRendererProps, TableRendererProps } from '../types'
import type { AnalyticsBridge, DatasourceAwareTabularQuery, ExploreResultV4, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import type { TableDataGridFetcher, TableDataGridProps, TableDataGridRow, TableDataGridStatePayload } from '@kong-ui-public/table-data-grid'
import { computed, defineAsyncComponent, inject, onUnmounted, ref } from 'vue'
import { TableDataGrid } from '@kong-ui-public/table-data-grid'
import '@kong-ui-public/table-data-grid/dist/style.css'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import composables from '../composables'
import useTopNQuery from '../composables/useTopNQuery'
import { CP_ID_TOKEN, ENTITY_ID_TOKEN, INJECT_QUERY_PROVIDER } from '../constants'
import { tableDataGridFetcherByDatasource, tableDataGridHeadersByDatasource } from '../utils/table-data-grid-renderer'
import { createTopNPresentation, type TopNGridRow } from '../utils/topn-columns'
import FallbackEntityLink from './FallbackEntityLink.vue'

type Props =
  | (TableRendererProps & { chartType: 'table', chartOptions?: undefined, fitToContent?: boolean })
  | (ChartRendererProps<TopNTableOptions> & { chartType: 'top_n', fitToContent?: boolean })

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'loading-change', isLoading: boolean): void
  (e: 'chart-data', data: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const datasourceConfigStore = useDatasourceConfigStore()
const { i18n } = composables.useI18n()
// DashboardTile keys this renderer by table type so each query lifecycle is disposed on a mode switch.
const { fetcher: topNFetcher, response, queryError } = props.chartType === 'top_n' ? useTopNQuery({
  props,
  chartData: data => emit('chart-data', data),
  queryComplete: () => emit('query-complete'),
}) : {}
const topNOptions = computed(() => props.chartType === 'top_n' ? props.chartOptions : undefined)
const presentation = computed(() => response?.value ? createTopNPresentation({
  data: response.value,
  columnOptions: topNOptions.value?.column_options,
  i18n,
}) : undefined)
const dimensionHeaders = computed(() => presentation.value?.headers.filter(header => header.type === 'dimension') ?? [])
const rendererStyle = computed(() => props.chartType === 'top_n' && props.fitToContent
  ? { height: 'auto' }
  : props.height === undefined ? undefined : { height: `${props.height}px` })

const abortController = new AbortController()
const responseMetaColumns = ref<string[]>([])
const hasError = ref(false)
onUnmounted(() => abortController.abort())

const datasourceAwareQuery = computed<DatasourceAwareTabularQuery | undefined>(() => props.chartType === 'table' ? {
  datasource: props.query.datasource,
  query: {
    columns: props.query.columns,
    cursor: props.query.cursor,
    entity: props.query.entity,
    filters: props.query.filters,
    page_size: props.query.page_size,
  },
} : undefined)
const tableRefreshKey = computed(() => props.chartType === 'table' ? JSON.stringify({
  refreshCounter: props.refreshCounter,
  query: {
    columns: props.query.columns,
    datasource: props.query.datasource,
    entity: props.query.entity,
    filters: props.query.filters,
    page_size: props.query.page_size,
  },
  context: {
    filters: props.context.filters,
    timeSpec: props.context.timeSpec,
    tz: props.context.tz,
  },
}) : undefined)

const fetcher: TableDataGridFetcher<TableDataGridRow> = async ({ cursor, pageSize }) => {
  try {
    await datasourceConfigStore.isReady()
    const query = datasourceAwareQuery.value
    if (!query) {
      throw new Error('A tabular query is required for infinite table fetching')
    }
    const fetchPage = tableDataGridFetcherByDatasource[query.datasource]
    if (!fetchPage) {
      throw new Error(`No table data grid fetcher found for datasource: ${query.datasource}`)
    }
    const result = await fetchPage({
      abortController,
      context: props.context,
      cursor,
      pageSize,
      query,
      onResponseColumns: columns => {
        responseMetaColumns.value = columns
      },
      stripUnknownFilters: datasourceConfigStore.stripUnknownFilters,
      tabularQueryFn: queryBridge?.tabularQueryFn,
    })
    hasError.value = false
    return result
  } catch (error) {
    hasError.value = true
    throw error
  }
}

// A shared grid uses generic rows; narrow only when calling TopN-specific presentation callbacks.
const isTopNRow = (row: TableDataGridRow): row is TopNGridRow => {
  const record = row.record
  return typeof record === 'object' && record !== null &&
    'timestamp' in record && typeof record.timestamp === 'string' &&
    'event' in record && typeof record.event === 'object' && record.event !== null
}

const gridProps = computed<TableDataGridProps<TableDataGridRow>>(() => {
  if (topNFetcher) {
    return {
      mode: 'unpaginated',
      fetcher: topNFetcher.value,
      headers: presentation.value?.headers.map(({ valueFormatter, ...header }) => ({
        ...header,
        valueFormatter: valueFormatter
          ? (value, row) => isTopNRow(row) ? valueFormatter(value, row) : ''
          : undefined,
        minWidth: header.type === 'dimension' ? 160 : header.bar ? 260 : 140,
      })) ?? [],
      error: !!queryError?.value || !!presentation.value?.errorMessage,
      tableConfig: { fitToContent: props.chartType === 'top_n' && props.fitToContent },
    }
  }
  if (props.chartType !== 'table') {
    throw new Error('Remount TableDataGridRenderer when changing chartType')
  }
  return {
    mode: 'infinite',
    fetcher,
    headers: tableDataGridHeadersByDatasource[props.query.datasource]({
      // Use response metadata when the query omits columns and the backend supplies defaults.
      columns: props.query.columns?.length ? props.query.columns : responseMetaColumns.value,
      translate: key => i18n.t(key as any) as string,
      canTranslate: key => i18n.te(key as any),
    }),
    pageSize: props.query.page_size,
    refreshKey: tableRefreshKey.value,
    error: hasError.value,
  }
})

const onState = (payload: TableDataGridStatePayload) => {
  // TopN publishes chart-data/query-complete; emitting loading-change too would duplicate tile completion.
  if (props.chartType === 'top_n') {
    return
  }
  if (payload.state === 'error') {
    hasError.value = true
  }
  emit('loading-change', payload.state === 'loading')
}

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
  const entityLinks = topNOptions.value?.entity_links

  if (!entityLinks) {
    return ''
  }

  return entityLinks[dimension] || Object.entries(entityLinks).find(([key]) => key.toLowerCase() === dimension.toLowerCase())?.[1] || ''
}

const getEntityLink = (dimension: string): string => {
  return getMappedEntityLink(dimension) || (dimensionHeaders.value[0]?.key === dimension ? topNOptions.value?.entity_link || '' : '')
}

const parseLink = (row: TableDataGridRow, dimension: string) => {
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
.table-data-grid-renderer {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-bottom: var(--kui-space-20, 8px);

  &.is-top-n {
    padding-bottom: 0;
    width: 100%;
  }
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
