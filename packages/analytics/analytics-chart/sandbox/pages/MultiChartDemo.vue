<template>
  <SandboxLayout
    :links="appLinks"
    title="Multiple Charts Demo"
  >
    <div class="chart-grid">
      <div class="chart-container">
        <AnalyticsChart
          :chart-data="timeseriesBarChartData"
          :chart-options="timeSeriesBarChartOptions"
          chart-title="Line Chart - Request count by Status Code"
          :legend-position="ChartLegendPosition.Bottom"
          :show-legend-values="true"
          tooltip-title="Requests"
        />
      </div>
      <div class="chart-container">
        <AnalyticsChart
          :chart-data="timeSeriesLineChartData"
          :chart-options="timeSeriesLineChartOptions"
          chart-title="Timeseries Line Chart - Requests Over Time"
          :legend-position="ChartLegendPosition.Right"
          :show-legend-values="true"
          tooltip-title="Requests"
        />
      </div>
      <div class="chart-container">
        <AnalyticsChart
          :chart-data="barChartData"
          :chart-options="barChartOptions"
          chart-title="Horizontal Bar Chart - Requests by Service"
          :legend-position="ChartLegendPosition.Bottom"
          :show-annotations="false"
          :show-legend-values="true"
          tooltip-title="Services"
        />
      </div>
      <div class="chart-container">
        <AnalyticsChart
          :chart-data="verticalBarChartData"
          :chart-options="verticalBarChartOptions"
          chart-title="Vertical Bar Chart - Latency by Status Code"
          :legend-position="ChartLegendPosition.Right"
          :show-annotations="false"
          :show-legend-values="true"
          tooltip-title="Latency"
        />
      </div>
    </div>
  </SandboxLayout>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import {
  AnalyticsChart,
  ChartLegendPosition,
} from '../../src'
import type { AnalyticsChartOptions } from '../../src/types'
import {
  generateCrossSectionalData,
  generateSingleMetricTimeSeriesData,
} from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const timeSeriesBarChartOptions: AnalyticsChartOptions = {
  type: 'timeseries_bar',
  stacked: true,
}

const timeSeriesLineChartOptions: AnalyticsChartOptions = {
  type: 'timeseries_line',
  stacked: false,
}

const barChartOptions: AnalyticsChartOptions = {
  type: 'horizontal_bar',
  stacked: true,
}

const verticalBarChartOptions: AnalyticsChartOptions = {
  type: 'vertical_bar',
  stacked: false,
}

const statusCodes = ['200', '300', '400', '500']
const services = ['service1', 'service2', 'service3', 'service4', 'service5']

const timeseriesBarChartData = generateSingleMetricTimeSeriesData(
  { name: 'LatencyP99', unit: 'ms' },
  { status_code: statusCodes },
)

const timeSeriesLineChartData = generateSingleMetricTimeSeriesData(
  { name: 'RequestCount', unit: 'count' },
  { status_code: statusCodes },
)

const barChartData = generateCrossSectionalData([{
  name: 'TotalRequests',
  unit: 'count',
}], {
  service: services,
})

const verticalBarChartData = generateCrossSectionalData([{
  name: 'LatencyP99',
  unit: 'ms',
}], {
  status_code: statusCodes,
})
</script>

<style lang="scss" scoped>
.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 24px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.chart-container {
  height: 400px;
  background-color: var(--kui-color-background);
  border: 1px solid var(--kui-color-border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
}

@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
