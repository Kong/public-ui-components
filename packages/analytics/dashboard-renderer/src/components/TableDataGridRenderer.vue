<template>
  <div
    class="table-data-grid-renderer"
    :style="rendererStyle"
  >
    <KSkeleton
      v-if="suppliedState ? suppliedState.status === 'loading' : !queryReady"
      data-testid="table-skeleton"
      type="table"
    />
    <KEmptyState
      v-else-if="suppliedState?.status === 'error'"
      :action-button-visible="false"
      data-testid="table-supplied-data-error"
    >
      <template #icon>
        <WarningOutlineIcon />
      </template>
      <template #title>
        <p>{{ suppliedState.message || i18n.t('renderer.unexpectedError') }}</p>
      </template>
    </KEmptyState>
    <TableDataGrid
      v-else-if="suppliedState"
      :headers="headers"
      mode="unpaginated"
      :rows="suppliedRows"
    />
    <TableDataGrid
      v-else
      :error="hasError"
      :fetcher="fetcher"
      :headers="headers"
      :page-size="query.page_size"
      :refresh-key="tableRefreshKey"
      @state="onState"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableRendererProps } from '../types'
import type { AnalyticsBridge, DatasourceAwareTabularQuery } from '@kong-ui-public/analytics-utilities'
import type { TableDataGridFetcher } from '@kong-ui-public/table-data-grid'
import { computed, inject, onUnmounted, ref, watch } from 'vue'
import { TableDataGrid } from '@kong-ui-public/table-data-grid'
import '@kong-ui-public/table-data-grid/dist/style.css'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import { WarningOutlineIcon } from '@kong/icons'
import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { isPlatformTabularResponse, resolveSuppliedData } from '../utils/supplied-tile-data'
import {
  platformTabularResponseToTableDataGridRows,
  tableDataGridFetcherByDatasource,
  tableDataGridHeadersByDatasource,
} from '../utils/table-data-grid-renderer'

type TableDataGridStatePayload = {
  state: 'loading' | 'success' | 'error'
  hasData: boolean
}
type TableDataGridRow = Record<string, unknown>

const props = defineProps<TableRendererProps>()

const emit = defineEmits<{
  (e: 'loading-change', isLoading: boolean): void
  (e: 'query-complete'): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const datasourceConfigStore = useDatasourceConfigStore()
const fieldLabel = composables.useFieldLabel()
const { i18n } = composables.useI18n()
const abortController = new AbortController()
const responseMetaColumns = ref<string[]>([])
const hasError = ref(false)

const rendererStyle = computed(() => props.height === undefined ? undefined : { height: `${props.height}px` })
const datasourceAwareQuery = computed<DatasourceAwareTabularQuery>(() => ({
  datasource: props.query.datasource,
  query: {
    columns: props.query.columns,
    cursor: props.query.cursor,
    entity: props.query.entity,
    filters: props.query.filters,
    page_size: props.query.page_size,
  },
}))
const tableRefreshKey = computed(() => JSON.stringify({
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
}))

onUnmounted(() => {
  abortController.abort()
})

const suppliedState = computed(() => props.suppliedData && resolveSuppliedData({
  supplied: props.suppliedData,
  isExpected: isPlatformTabularResponse,
  mismatchMessage: i18n.t('renderer.suppliedDataMismatch'),
}))
const suppliedResponse = computed(() => suppliedState.value?.status === 'success' ? suppliedState.value.data : undefined)
// `null` renders the grid with no rows, so it shows the grid's own empty state.
const suppliedRows = computed<TableDataGridRow[]>(() => suppliedResponse.value ? platformTabularResponseToTableDataGridRows(suppliedResponse.value) : [])

const headers = computed(() => tableDataGridHeadersByDatasource[props.query.datasource]({
  // query.columns are optional in the API. If not provided, backend will return default columns.
  // If query columns are not provided, fallback to using columns from the response metadata for header configuration.
  columns: props.query.columns?.length
    ? props.query.columns
    : suppliedResponse.value?.meta.columns ?? responseMetaColumns.value,
  fieldLabel: key => fieldLabel(key),
}))

const fetcher = computed<TableDataGridFetcher<TableDataGridRow>>(() => async ({ cursor, pageSize }) => {
  try {
    await datasourceConfigStore.isReady()
    const fetcher = tableDataGridFetcherByDatasource[datasourceAwareQuery.value.datasource]
    if (!fetcher) {
      throw new Error(`No table data grid fetcher found for datasource: ${datasourceAwareQuery.value.datasource}`)
    }

    const result = await fetcher({
      abortController,
      context: props.context,
      cursor,
      pageSize,
      query: datasourceAwareQuery.value,
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
})

const onState = (payload: TableDataGridStatePayload) => {
  if (payload.state === 'error') {
    hasError.value = true
  }

  emit('loading-change', payload.state === 'loading')
}

watch(suppliedState, current => {
  if (current && current.status !== 'loading') {
    emit('query-complete')
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.table-data-grid-renderer {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-bottom: var(--kui-space-20, 8px);
}
</style>
