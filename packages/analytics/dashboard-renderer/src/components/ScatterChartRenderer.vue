<template>
  <QueryDataProvider
    v-if="!isRequestsQuery"
    v-slot="{ data: exploreData }"
    :context="context"
    :query="exploreQuery"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
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
      <VisibilityOffIcon v-if="queryError?.type === 'forbidden'" />
      <WarningOutlineIcon v-else />
    </template>
    <template #title>
      <p>{{ queryError?.message || i18n.t('renderer.unexpectedError') }}</p>
    </template>
    <template
      v-if="queryError?.details"
      #default
    >
      <p>{{ queryError.details }}</p>
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
  if (isRequestsQuery.value && props.queryReady) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

const queryError = ref<QueryError | null>(null)

const { data, error, isValidating } = useSWRV(queryKey, async () => {
  const startKey = queryKey()
  const query = props.query as ApiRequestsQuery

  try {
    const result = await issueRequestsQuery(query, props.context)

    if (queryKey() !== startKey) {
      // The original fetch has been superseded by a newer query
      return undefined
    }

    queryError.value = null

    return requestsToScatterData(result, toRequestsScatterOptions(query))
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

const { state, swrvState: STATE } = useSwrvState(data, error, isValidating)

const oldData = ref<ScatterChartData | undefined>()
const displayData = computed(() => data.value ?? oldData.value)

watch(data, newData => {
  if (newData) {
    oldData.value = newData
  }
})

const hasError = computed(() => state.value === STATE.ERROR || !!queryError.value)

const isLoading = computed(() => !hasError.value && (!props.queryReady || state.value === STATE.PENDING) && !displayData.value)

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
