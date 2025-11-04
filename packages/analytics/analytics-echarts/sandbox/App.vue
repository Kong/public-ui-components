<template>
  <div class="sandbox-container">
    <main>
      <div class="flex-container">
        <KCard class="chart-section">
          <div class="chart-container">
            <AnalyticsEcharts
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
            <KSegmentedControl
              v-model="chartType"
              :options="[
                { label: 'Line', value: 'timeseries_line' },
                { label: 'Bar', value: 'timeseries_bar' },
              ]"
            />
          </div>
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
            <KLabel> Import chart data </KLabel>
            <CodeText v-model="exploreResultText" />
          </div>
        </KCard>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { generateSingleMetricTimeSeriesData, type AnalyticsExploreRecord, type ExploreAggregations, type ExploreResultV4, type QueryResponseMeta, type ReportChartTypes } from '@kong-ui-public/analytics-utilities'
import { AnalyticsEcharts } from '../src'
import { computed, ref } from 'vue'
import CodeText from './CodeText.vue'
import type { Threshold } from '../src/components/AnalyticsEcharts.vue'

const chartType = ref<ReportChartTypes>('timeseries_line')
const exploreResultText = ref('')
const theme = ref<'light' | 'dark'>('light')
const renderMode = ref<'svg' | 'canvas'>('svg')
const stacked = ref(false)
const eventLog = ref('')
const threshold = ref(false)
const thresholdValue = ref(100)
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

const data = computed<ExploreResultV4>(() => {
  if (exploreResultText.value) {

    try {
      const result = JSON.parse(exploreResultText.value)

      return result as ExploreResultV4
    } catch {
      return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
    }
  }
  return generateSingleMetricTimeSeriesData(
    { name: 'request_count', unit: 'count' },
    { statusCode: ['200', '300', '400', '500'] },
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
