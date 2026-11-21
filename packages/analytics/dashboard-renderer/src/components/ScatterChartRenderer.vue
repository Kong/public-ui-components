<template>
  <QueryDataProvider
    v-if="!isRequestsQuery"
    v-slot="{ data: exploreData }"
    :context="context"
    :query="exploreQuery"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    :supplied-data="suppliedData"
    @chart-data="emit('chart-data', $event)"
    @query-complete="emit('query-complete')"
  >
    <div class="analytics-chart">
      <AnalyticsChart
        :chart-data="exploreData"
        :chart-options="options"
        legend-position="bottom"
        :synthetics-data-key="chartOptions.synthetics_data_key"
        tooltip-title=""
      />
    </div>
  </QueryDataProvider>

  <KSkeleton
    v-else-if="isLoading"
    class="chart-skeleton"
    type="table"
  />

  <KEmptyState
    v-else-if="hasError"
    :action-button-visible="false"
    data-testid="scatter-chart-empty-state"
  >
    <template #icon>
      <VisibilityOffIcon v-if="displayError?.type === 'forbidden'" />
      <WarningOutlineIcon v-else />
    </template>
    <template #title>
      <p>{{ displayError?.message || i18n.t('renderer.unexpectedError') }}</p>
    </template>
    <template
      v-if="displayError?.details"
      #default
    >
      <p>{{ displayError.details }}</p>
    </template>
  </KEmptyState>

  <KEmptyState
    v-else-if="isEmpty"
    :action-button-visible="false"
    data-testid="scatter-chart-no-data-state"
  >
    <template #title>
      <p>{{ i18n.t('renderer.noDataAvailable.title') }}</p>
    </template>
    <template #default>
      <p>{{ i18n.t('renderer.noDataAvailable.description') }}</p>
    </template>
  </KEmptyState>

  <div
    v-else-if="displayData"
    class="analytics-chart"
  >
    <AnalyticsChart
      :chart-data="displayData"
      :chart-options="options"
      legend-position="bottom"
      :loading="isStale"
      :synthetics-data-key="chartOptions.synthetics_data_key"
      tooltip-title=""
    />
  </div>
</template>

<script setup lang="ts">
import type { AnalyticsChartOptions, QueryError, ScatterChartData } from '@kong-ui-public/analytics-chart'
import type { ApiRequestsQuery, ExploreResultV4, TimeRangeV4, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { ScatterRendererProps } from '../types'

import { computed, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import { AnalyticsChart, handleQueryError, requestsToScatterData } from '@kong-ui-public/analytics-chart'
import { finestGranularityForDuration, Granularities } from '@kong-ui-public/analytics-utilities'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'

import composables from '../composables'
import { toRequestsScatterOptions } from '../utils/requests-query'
import { isApiRequestsResult, resolveSuppliedData } from '../utils/supplied-tile-data'
import { getTimeRangeDurationMs } from '../utils/time-range-support'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ScatterRendererProps>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const { issueRequestsQuery } = composables.useIssueRequestsQuery()

const isRequestsQuery = computed(() => props.query.datasource === 'requests')

// Explore-backed scatter tiles pass supplied data to QueryDataProvider, which checks it there.
const suppliedState = computed(() => isRequestsQuery.value && props.suppliedData
  ? resolveSuppliedData({
    supplied: props.suppliedData,
    isExpected: isApiRequestsResult,
    mismatchMessage: i18n.t('renderer.suppliedDataMismatch'),
  })
  : undefined)

const exploreQuery = computed<ValidDashboardChartQuery>(() => {
  const query = props.query as ValidDashboardChartQuery
  const timeRange = (query.time_range ?? props.context.timeSpec) as TimeRangeV4 | undefined
  const durationMs = timeRange ? getTimeRangeDurationMs(timeRange) : undefined

  if (!durationMs) {
    return query
  }

  const finest = finestGranularityForDuration(durationMs)
  let granularity

  if (query.granularity && Granularities[query.granularity] >= Granularities[finest]) {
    granularity = query.granularity
  } else {
    granularity = finest
  }

  return { ...query, granularity } as ValidDashboardChartQuery
})

const queryKey = () => {
  if (isRequestsQuery.value && props.queryReady && !props.suppliedData) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

const queryError = ref<QueryError | null>(null)

const { data: keyedData, error, isValidating } = useSWRV<
  { key: string, result: ScatterChartData | undefined } | undefined
>(queryKey, async (startKey: string) => {
  const query = props.query as ApiRequestsQuery

  try {
    const result = await issueRequestsQuery(query, props.context)

    if (queryKey() !== startKey) {
      // The original fetch has been superseded by a newer query
      return undefined
    }

    queryError.value = null

    return {
      key: startKey,
      result: requestsToScatterData(result, toRequestsScatterOptions(query)),
    }
  } catch (e: any) {
    if (queryKey() !== startKey) {
      // This avoids an empty error state when a fetch has been aborted
      return undefined
    }

    queryError.value = handleQueryError(e)

    throw e
  } finally {
    if (queryKey() === startKey) {
      emit('query-complete')
    }
  }
}, {
  refreshInterval: props.context.refreshInterval,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
})

const data = computed(() => keyedData.value?.result)

const { state, swrvState: STATE } = useSwrvState(keyedData, error, isValidating)

const oldData = ref<ScatterChartData | undefined>()

watch(data, newData => {
  if (newData) {
    oldData.value = newData
  }
})

// Each state below reads the supplied data when the host passes it, and the query otherwise.
const displayData = computed(() => {
  if (suppliedState.value) {
    // Supplied data is complete, so it is never truncated.
    return suppliedState.value.status === 'success'
      ? requestsToScatterData(
        { ...suppliedState.value.data, truncated: false, limit: suppliedState.value.data.results.length },
        toRequestsScatterOptions(props.query as ApiRequestsQuery),
      )
      : undefined
  }

  return data.value ?? oldData.value
})

const displayError = computed<QueryError | null>(() => {
  if (suppliedState.value) {
    return suppliedState.value.status === 'error' ? { type: 'other', message: suppliedState.value.message } : null
  }

  return queryError.value
})

const hasError = computed(() => suppliedState.value
  ? suppliedState.value.status === 'error'
  : state.value === STATE.ERROR || !!queryError.value)

const isLoading = computed(() => suppliedState.value
  ? suppliedState.value.status === 'loading'
  : !hasError.value && (!props.queryReady || state.value === STATE.PENDING) && !displayData.value)

const isEmpty = computed(() => suppliedState.value?.status === 'empty')

const isStale = computed(() => !suppliedState.value && !!displayData.value && keyedData.value?.key !== queryKey())

watch(suppliedState, current => {
  if (current && current.status !== 'loading') {
    emit('query-complete')
  }
}, { immediate: true })

const options = computed((): AnalyticsChartOptions => ({
  type: 'scatter',
  chartDatasetColors: props.chartOptions.chart_dataset_colors,
  scatter: {
    percentileLines: props.chartOptions.percentile_lines?.map(line => ({
      percentile: line.percentile,
      label: line.label,
      borderDash: line.border_dash,
      color: line.color,
    })),
    outlierPercentile: props.chartOptions.outlier_percentile,
    shadeOutlierRegion: props.chartOptions.shade_outlier_region,
    jitterMs: props.chartOptions.jitter_ms,
    pointRadius: props.chartOptions.point_radius,
    pointOpacity: props.chartOptions.point_opacity,
  },
}))
</script>

<style scoped lang="scss">
.analytics-chart {
  height: 100%;
}
</style>
