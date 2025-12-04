<template>
  <div class="sandbox-container">
    <main>
      <div class="flex-container">
        <KCard class="chart-section">
          <KSelect
            v-model="chartType"
            :items="[
              { label: 'Timeseries Line', value: 'timeseries_line' },
              { label: 'Timeseries Bar', value: 'timeseries_bar' },
              { label: 'Vertical Bar', value: 'vertical_bar' },
              { label: 'Horizontal Bar', value: 'horizontal_bar' },
              { label: 'Donut', value: 'donut' },
            ]"
            label="Chart Type"
          />
          <div
            v-if="isTimeseries"
            class="chart-container"
          >
            <TimeseriesChart
              :data="data"
              :explore-link="{ href: '#' }"
              :render-mode="renderMode"
              :requests-link="{ href: '#' }"
              :stacked="stacked"
              :theme="theme"
              :threshold="chartThreshold"
              timeseries-zoom
              :type="chartType"
              @select-chart-range="eventLog += 'Select chart range ' + JSON.stringify($event) + '\n'"
              @zoom-time-range="eventLog += 'Zoomed to ' + JSON.stringify($event) + '\n'"
            />
          </div>
          <div
            v-else
            class="chart-container"
          >
            <CrossSectionChart
              :data="crossSectionalData"
              :explore-link="{ href: '#' }"
              :render-mode="renderMode"
              :requests-link="{ href: '#' }"
              :stacked="stacked"
              :theme="theme"
              :threshold="chartThreshold"
              timeseries-zoom
              :type="chartType"
              @select-chart-range="eventLog += 'Select chart range ' + JSON.stringify($event) + '\n'"
              @zoom-time-range="eventLog += 'Zoomed to ' + JSON.stringify($event) + '\n'"
            />
          </div>
          <KLabel>Event Log</KLabel>
          <KCodeBlock
            id="event-log-codeblock"
            :code="eventLog"
            language="json"
            searchable
          />
        </KCard>
        <KCard class="controls-section">
          <div class="controls-item">
            <KSelect
              v-model="renderMode"
              :items="[
                { label: 'SVG', value: 'svg' },
                { label: 'Canvas', value: 'canvas' },
              ]"
              label="Render mode"
            />
          </div>
          <div class="controls-item">
            <KSelect
              v-model="theme"
              :items="[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]"
              label="Theme"
            />
          </div>
          <div class="controls-item">
            <KInputSwitch
              v-model="stacked"
              :label="stacked ? 'Stacked' : 'Not Stacked'"
            />
          </div>

          <div class="controls-item">
            <KInputSwitch
              v-model="threshold"
              label="threshold"
            />
            <KInput
              v-model="thresholdValue"
              :disabled="!threshold"
              type="number"
            />
          </div>

          <div class="controls-item">
            <KInputSwitch
              v-model="isMultiDimension"
              :label="isMultiDimension ? 'Multiple Dimensions' : 'Single Dimension'"
            />
          </div>

          <div class="controls-item">
            <KInputSwitch
              v-model="isMultiMetric"
              :label="isMultiMetric ? 'Multiple Metrics' : 'Single Metric'"
            />
          </div>

          <div class="controls-item">
            <KLabel> Import chart data </KLabel>
            <CodeText v-model="exploreResultText" />
          </div>
        </KCard>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { generateCrossSectionalData, generateMultipleMetricTimeSeriesData, generateSingleMetricTimeSeriesData, type AnalyticsExploreRecord, type ExploreAggregations, type ExploreResultV4, type QueryResponseMeta, type ReportChartTypes } from '@kong-ui-public/analytics-utilities'
import { CrossSectionChart, TimeseriesChart } from '../src'
import type { Threshold } from '../src'
import { computed, ref } from 'vue'
import CodeText from './CodeText.vue'

type SupportedChartTypes =
  | 'horizontal_bar'
  | 'vertical_bar'
  | 'timeseries_line'
  | 'timeseries_bar'
  | 'donut'

const chartType = ref<SupportedChartTypes>('timeseries_line')
const exploreResultText = ref('')
const theme = ref<'light' | 'dark'>('light')
const renderMode = ref<'svg' | 'canvas'>('svg')
const stacked = ref(false)
const eventLog = ref('')
const threshold = ref(false)
const thresholdValue = ref(100)
const isMultiDimension = ref(false)
const isMultiMetric = ref(false)

const dimensions = computed(() => {
  return {
    statusCode: ['200', '300', '400', '500'],
    ... (isMultiDimension.value ? { [crypto.randomUUID()]: [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()] } : {}),
  }
})
const chartThreshold = computed<Partial<Record<ExploreAggregations, Threshold[]>> | undefined>(() => {
  if (!threshold.value) return undefined

  return {
    request_count: [
      {
        type: 'error',
        value: thresholdValue.value,
        highlightIntersections: true,
      },
    ],
  }
})

const isTimeseries = computed(() => chartType.value === 'timeseries_line' || chartType.value === 'timeseries_bar')

const data = computed<ExploreResultV4>(() => {
  if (exploreResultText.value) {

    try {
      const result = JSON.parse(exploreResultText.value)

      return result as ExploreResultV4
    } catch {
      return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
    }
  }
  return isMultiMetric.value ?
    generateMultipleMetricTimeSeriesData(
      [
        { name: 'request_count', unit: 'count' },
        { name: 'latency', unit: 'ms' },
      ],
    )
    : generateSingleMetricTimeSeriesData(
      { name: 'request_count', unit: 'count' },
      dimensions.value,
    )
})

const crossSectionalData = computed<ExploreResultV4>(() => {
  if (exploreResultText.value) {

    try {
      const result = JSON.parse(exploreResultText.value)

      return result as ExploreResultV4
    } catch {
      return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
    }
  }
  return generateCrossSectionalData(
    [{ name: 'request_count', unit: 'count' }],
    dimensions.value,
  )
})

</script>

<style scoped lang="scss">
.sandbox-container {
  .flex-container {
    display: flex;
    gap: 16px;
    margin-top: 16px;

    .chart-section {
      flex: 3;
    }

    .controls-section {
      flex: 1;

      .controls-item {
        margin: 8px;
      }
    }

    .chart-container {
      height: 400px;
      width: 100%;
    }
  }
}
</style>
