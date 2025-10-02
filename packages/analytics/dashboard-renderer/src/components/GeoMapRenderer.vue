<template>
  <QueryDataProvider
    :context="context"
    :limit-override="COUNTRIES.length"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    @chart-data="onChartData"
  >
    <AnalyticsGeoMap
      :bounds="chartOptions.bounds"
      :country-metrics="countryMetrics"
      :fit-to-country="chartOptions.fit_to_country"
      :metric="(countryMetric as ExploreAggregations)"
      :metric-unit="(countryMetricUnit as MetricUnits)"
      :with-legend="chartOptions.legend || false"
    />
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { MetricUnits } from '@kong-ui-public/analytics-geo-map'
import type { ChoroplethMapOptions, ExploreAggregations, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { RendererProps } from '../types'

import { ref, computed } from 'vue'
import QueryDataProvider from './QueryDataProvider.vue'
import { AnalyticsGeoMap, exploreResultToCountryMetrics } from '@kong-ui-public/analytics-geo-map'
import { COUNTRIES } from '@kong-ui-public/analytics-utilities'
import '@kong-ui-public/analytics-geo-map/dist/style.css'

defineProps<RendererProps<ChoroplethMapOptions>>()

const chartDataRaw = ref<ExploreResultV4 | undefined>(undefined)

const countryMetrics = computed((): Record<string, number> => {
  if (!chartDataRaw.value) {
    return {}
  }

  return exploreResultToCountryMetrics(chartDataRaw.value)
})

const countryMetric = computed(() => {
  if (!chartDataRaw.value) {
    return ''
  }

  return chartDataRaw.value?.meta.metric_names && chartDataRaw.value.meta.metric_names[0]
})

const countryMetricUnit = computed(() => {
  if (!chartDataRaw.value) {
    return ''
  }

  const metricUnits = chartDataRaw?.value?.meta.metric_units
  const metricNames = chartDataRaw?.value?.meta?.metric_names

  return metricUnits && metricNames && metricUnits[metricNames[0]]
})

const onChartData = (data: ExploreResultV4) => {
  chartDataRaw.value = data
}

</script>
