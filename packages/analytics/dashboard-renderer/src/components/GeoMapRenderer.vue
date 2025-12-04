<template>
  <QueryDataProvider
    :context="context"
    :limit-override="limitOverride"
    :query="mapQuery"
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
      @bounds-change="onBoundsChange"
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
import { COUNTRIES, type ExploreEmptyFilterV2 } from '@kong-ui-public/analytics-utilities'
import '@kong-ui-public/analytics-geo-map/dist/style.css'

const props = defineProps<RendererProps<ChoroplethMapOptions>>()

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

const limitOverride = computed(() => {
  if (props.query.limit !== undefined && props.query.limit > 0) {
    return props.query.limit
  }

  return COUNTRIES.length
})

const mapQuery = computed(() => {
  const hasExistingCountryFilter = props.query.filters?.find(({ field, operator }) => {
    const isCountry = field === 'country_code'
    // if we have an explicit empty or not_empty filter, adding an additional empty filter is wrong
    const isEmpty = operator === 'not_empty' || operator === 'empty'
    // if we have an 'in' filter, an additional empty filter does nothing
    const isIn = operator === 'in'
    return isCountry && (isEmpty || isIn)
  })

  if (!hasExistingCountryFilter) {
    // as long as we don't have a country filter already, add a 'not_empty'
    // filter for country. The map display doesn't show empty values and a limit
    // will frequently include empty in the results. For example, if you limit
    // to 5, you might get US, UK, China, Japan, and empty, which would look
    // like 4 results.
    const noEmpty = {
      field: 'country_code',
      operator: 'not_empty',
    } as ExploreEmptyFilterV2

    return {
      ...props.query,
      filters: [
        ...(props.query.filters || []),
        noEmpty,
      ] as any,
    }
  }

  return props.query
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

const emit = defineEmits<{
  (e: 'bounds-change', newBounds: Array<[number, number]>): void
}>()
const onBoundsChange = (e: Array<[number, number]>) => {
  emit('bounds-change', e)
}
</script>
