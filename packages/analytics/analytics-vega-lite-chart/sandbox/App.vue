<template>
  <div class="sandbox-container">
    <main>
      <p>This is the component sandbox.</p>

      <h3> Chart type</h3>
      <KSegmentedControl
        v-model="chartType"
        :options="['timeseries_line', 'timeseries_bar', 'timeseries_area']"
      />

      <h3>Temporal Chart (Dimension)</h3>
      <button @click="updateDimensionalData">
        Update Data
      </button>
      <div class="component-container">
        <TemporalChart
          :chart-type="chartType"
          :data="temporalDimensionalData"
        />
      </div>

      <h3>Temporal Chart (Metric)</h3>
      <button @click="updateMetricData">
        Update Data
      </button>
      <div class="component-container">
        <TemporalChart
          :chart-type="chartType"
          :data="temporalMetricData"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TemporalChart } from '../src'
import { generateMultipleMetricTimeSeriesData, generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'

const chartType = ref<'timeseries_line' | 'timeseries_bar' | 'timeseries_area'>('timeseries_line')

const temporalDimensionalData = ref(generateSingleMetricTimeSeriesData(
  { name: 'request_count', unit: 'count' },
  { statusCode: ['200', '400', '500'] },
))

const temporalMetricData = ref(generateMultipleMetricTimeSeriesData(
  [{ name: 'request_count', unit: 'count' }, { name: 'response_time', unit: 'ms' }],
))


const updateDimensionalData = () => {
  temporalDimensionalData.value = generateSingleMetricTimeSeriesData(
    { name: 'request_count', unit: 'count' },
    { statusCode: ['200', '400', '500'] },
  )
}

const updateMetricData = () => {
  temporalMetricData.value = generateMultipleMetricTimeSeriesData(
    [{ name: 'request_count', unit: 'count' }, { name: 'response_time', unit: 'ms' }],
  )
}
</script>

<style lang="scss" scoped>
.component-container {
  border: 1px solid lightgray;
  border-radius: 10px;
  height: 300px;
  padding: 20px;
}
</style>
