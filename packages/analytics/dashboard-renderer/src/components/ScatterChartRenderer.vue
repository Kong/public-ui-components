<template>
  <QueryDataProvider
    v-if="!isRequestsQuery"
    v-slot="{ data: exploreData }"
    :context="context"
    :query="(query as ValidDashboardChartQuery)"
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
      <p>{{ errorMessage }}</p>
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
import type { ApiRequestsQuery, ExploreResultV4, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { ScatterRendererProps } from '../types'

import { computed, onUnmounted, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import { AnalyticsChart, handleQueryError } from '@kong-ui-public/analytics-chart'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'

import composables from '../composables'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ScatterRendererProps>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()

const isRequestsQuery = computed(() => props.query.datasource === 'requests')
const scatterDataFn = computed(() => props.context.scatterDataFn)

let abortController: AbortController | null = null

onUnmounted(() => {
  abortController?.abort()
})

const queryKey = () => {
  if (isRequestsQuery.value && props.queryReady && scatterDataFn.value) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

const queryError = ref<QueryError | null>(null)

const { data, error, isValidating } = useSWRV(queryKey, async () => {
  const startKey = queryKey()

  abortController?.abort()
  const controller = new AbortController()
  abortController = controller

  try {
    const result = await scatterDataFn.value!(props.query as ApiRequestsQuery, props.context, controller)

    if (queryKey() !== startKey) {
      // The original fetch has been superseded by a newer query
      return undefined
    }

    queryError.value = null

    return result
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

const hasError = computed(() => !scatterDataFn.value || state.value === STATE.ERROR || !!queryError.value)
const errorMessage = computed(() => {
  if (!scatterDataFn.value) {
    return i18n.t('renderer.noScatterDataFn')
  }

  return queryError.value?.message || i18n.t('renderer.unexpectedError')
})

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
