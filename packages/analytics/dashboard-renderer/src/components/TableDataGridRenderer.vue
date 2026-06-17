<template>
  <div
    class="table-data-grid-renderer"
    :style="rendererStyle"
  >
    <KSkeleton
      v-if="!queryReady"
      data-testid="table-skeleton"
      type="table"
    />
    <TableDataGrid
      v-else
      :error="hasError"
      :fetcher="fetcher"
      :headers="headers"
      :page-size="query.page_size"
      :refresh-key="refreshCounter"
      @state="onState"
    />
  </div>
</template>

<script setup lang="ts">
import type { DashboardRendererContextInternal } from '../types'
import type { AnalyticsBridge, DatasourceAwareTabularQuery, PlatformTabularQuery } from '@kong-ui-public/analytics-utilities'
import type {
  TableDataGridFetcher,
} from '@kong-ui-public/table-data-grid'
import { computed, inject, onUnmounted, ref } from 'vue'
import { TableDataGrid } from '@kong-ui-public/table-data-grid'
import '@kong-ui-public/table-data-grid/dist/style.css'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import {
  tableDataGridFetcherByDatasource,
  tableDataGridHeadersByDatasource,
} from '../utils/table-data-grid-renderer'

type TableDataGridRow = Record<string, unknown>
type PlatformTabularTileQuery = PlatformTabularQuery & {
  datasource: 'platform'
}
type TableDataGridStatePayload = {
  state: 'loading' | 'success' | 'error'
  hasData: boolean
}

const props = defineProps<{
  context: DashboardRendererContextInternal
  height?: number
  query: PlatformTabularTileQuery
  queryReady: boolean
  refreshCounter: number
}>()

const emit = defineEmits<{
  (e: 'loading-change', isLoading: boolean): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const datasourceConfigStore = useDatasourceConfigStore()
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

onUnmounted(() => {
  abortController.abort()
})

const headers = computed(() => tableDataGridHeadersByDatasource[props.query.datasource]({
  // Query columns are preferred for stable configured headers. Response meta columns
  // are only a safety fallback for configs that omit query columns.
  columns: props.query.columns?.length ? props.query.columns : responseMetaColumns.value,
  translate: key => i18n.t(key as any) as string,
  canTranslate: key => i18n.te(key as any),
}))

const fetcher = computed<TableDataGridFetcher<TableDataGridRow>>(() => {
  const fetchRows = tableDataGridFetcherByDatasource[datasourceAwareQuery.value.datasource]({
    abortController,
    context: props.context,
    onResponseColumns: columns => {
      responseMetaColumns.value = columns
    },
    query: datasourceAwareQuery.value,
    stripUnknownFilters: ({ datasource, filters }) => datasourceConfigStore.stripUnknownFilters({
      datasource,
      filters,
    }),
    tabularQueryFn: queryBridge?.tabularQueryFn,
  })

  return async (params) => {
    try {
      await datasourceConfigStore.isReady()
      const result = await fetchRows(params)
      hasError.value = false

      return result
    } catch (error) {
      hasError.value = true
      throw error
    }
  }
})

const onState = (payload: TableDataGridStatePayload) => {
  if (payload.state === 'error') {
    hasError.value = true
  }

  emit('loading-change', payload.state === 'loading')
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
}
</style>
