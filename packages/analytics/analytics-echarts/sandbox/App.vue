<template>
  <div class="sandbox-container">
    <main>
      <div class="chart-container">
        <AnalyticsEcharts :data="data" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import { AnalyticsEcharts } from '../src'

const data = generateSingleMetricTimeSeriesData(
  { name: 'request_count', unit: 'count' },
  { statusCode: ['200', '300', '400', '500'] },
)
</script>

<style scoped lang="scss">
.sandbox-container {

  .chart-container {
    height: 400px;
    width: 100%;
  }
}
</style>
