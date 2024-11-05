<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
  >
    <div class="analytics-chart">
      <AnalyticsChart
        :allow-csv-export="chartOptions.allowCsvExport"
        :chart-data="data"
        :chart-options="options"
        :chart-title="chartOptions.chartTitle"
        :go-to-explore="exploreLink"
        legend-position="bottom"
        :show-menu="context.editable"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
        tooltip-title=""
        v-bind="extraProps"
      >
        <template
          v-if="context.editable"
          #menu-items
        >
          <KDropdownItem @click="editTile">
            {{ i18n.t('renderer.edit') }}
          </KDropdownItem>
        </template>
      </AnalyticsChart>
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed, defineProps, inject } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart } from '@kong-ui-public/analytics-chart'
import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { AiExploreAggregations, AiExploreQuery, AnalyticsBridge, ExploreAggregations, ExploreQuery, QueryableAiExploreDimensions, QueryableExploreDimensions, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'

const props = defineProps<RendererProps<any> & { extraProps?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'edit-tile'): void
}>()
const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { i18n } = composables.useI18n()

const options = computed((): AnalyticsChartOptions => ({
  type: props.chartOptions.type,
  stacked: props.chartOptions.stacked ?? false,
  chartDatasetColors: props.chartOptions.chartDatasetColors,
}))

const exploreLink = computed(() => {
  if (queryBridge && queryBridge.exploreBaseUrl) {
    const exploreQuery: ExploreQuery | AiExploreQuery = {
      filters: props.query.filters ?? [],
      metrics: props.query.metrics as ExploreAggregations[] | AiExploreAggregations[] ?? [],
      dimensions: props.query.dimensions as QueryableExploreDimensions[] | QueryableAiExploreDimensions[] ?? [],
      time_range: props.query.time_range as TimeRangeV4 || props.context.timeSpec,

    } as ExploreQuery | AiExploreQuery
    // Explore only supports advanced or ai
    const datasource = ['advanced', 'ai'].includes(props.query.datasource) ? props.query.datasource : 'advanced'
    return `${queryBridge.exploreBaseUrl()}?q=${JSON.stringify(exploreQuery)}&d=${datasource}&c=${props.chartOptions.type}`
  }

  return ''
})

const editTile = () => {
  emit('edit-tile')
}
</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`');
}
</style>
