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
        legend-position="bottom"
        :show-menu="editable"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
        tooltip-title=""
        v-bind="extraProps"
      >
        <template
          v-if="editable"
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
import { computed, defineProps } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart } from '@kong-ui-public/analytics-chart'
import composables from '../composables'

const props = defineProps<RendererProps<any> & { extraProps?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'edit-tile'): void
}>()
const { i18n } = composables.useI18n()

const options = computed((): AnalyticsChartOptions => ({
  type: props.chartOptions.type,
  stacked: props.chartOptions.stacked ?? false,
  chartDatasetColors: props.chartOptions.chartDatasetColors,
}))

const editTile = () => {
  emit('edit-tile')
}
</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`');
}
</style>
