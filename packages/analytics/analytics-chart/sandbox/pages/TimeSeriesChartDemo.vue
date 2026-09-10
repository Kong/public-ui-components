<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
  >
    <div class="sandbox-container">
      <div class="chart-section">
        <div style="height: 500px">
          <!-- Determine if a full blown chart is to be displayed, or a simplified one -->
          <AnalyticsChart
            :chart-data="(exploreResult)"
            :chart-options="analyticsChartOptions"
            :legend-position="legendPosition"
            :requests-link="{
              href: '#requests',
            }"
            :show-annotations="showAnnotationsToggle"
            :show-legend-values="showLegendValuesToggle"
            :threshold="threshold"
            :timeseries-zoom="timeSeriesZoomToggle"
            tooltip-title="tooltip title"
            @select-chart-range="eventLog += 'Select chart range ' + JSON.stringify($event) + '\n'"
            @zoom-time-range="eventLog += 'Zoomed to ' + JSON.stringify($event) + '\n'"
          />
        </div>


        <label>Event Log</label>
        <KCodeBlock
          id="event-log-codeblock"
          :code="eventLog"
          language="json"
          searchable
        />

        <br>

        <div class="data-container">
          <KLabel>ChartData</KLabel>
          <KCodeBlock
            v-if="dataCode"
            id="data-codeblock"
            :code="dataCode"
            language="json"
            searchable
          />
        </div>
        <br>

        <div class="options-container">
          <KLabel>Chart Options</KLabel>
          <KCodeBlock
            v-if="optionsCode"
            id="options-codeblock"
            :code="optionsCode"
            language="json"
            searchable
          />
        </div>
      </div>
      <KCard class="controls-section">
        <!-- AnalyticsChart / SimpleChart type selector -->
        <div class="flex-vertical">
          <KLabel>Chart Type</KLabel>
          <div class="chart-radio-group">
            <div>
              <KRadio
                v-model="chartType"
                name="chartType"
                :selected-value="'timeseries_line'"
              >
                Timeseries Line
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="chartType"
                name="chartType"
                :selected-value="'timeseries_bar'"
              >
                Timeseries Bar
              </KRadio>
            </div>
          </div>

          <!-- Legend position -->
          <div class="flex-vertical">
            <KLabel>Legend position</KLabel>

            <div>
              <KRadio
                v-model="legendPosition"
                name="legendPosition"
                :selected-value="ChartLegendPosition.Bottom"
              >
                {{ ChartLegendPosition.Bottom }}
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="legendPosition"
                name="legendPosition"
                :selected-value="ChartLegendPosition.Hidden"
              >
                {{ ChartLegendPosition.Hidden }}
              </KRadio>
            </div>
          </div>
          <br>
          <!-- Metric item selection -->
          <KMultiselect
            v-model="selectedMetricNames"
            :items="metricItemDefinitions"
            label="Metrics"
            placeholder="Select metrics"
            width="100%"
            @selected="onMetricsSelected"
          />
        </div>

        <!-- Dataset options -->
        <KLabel>Dataset options</KLabel>
        <div class="dataset-options">
          <KButton
            size="small"
            @click="addDimension()"
          >
            Add dimension value
          </KButton>
        </div>

        <KLabel>Option toggles</KLabel>
        <div>
          <KInputSwitch
            v-model="multiDimensionToggle"
            :label="multiDimensionToggle ? 'Multi Dimension' : 'Single Dimension'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="stackToggle"
            :label="stackToggle ? 'Stacked' : 'Not Stacked'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="showLegendValuesToggle"
            :label="showLegendValuesToggle ? 'Show Legend Values' : 'No Legend Values'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="limitToggle"
            :label="limitToggle ? 'Has Limit' : 'No Limit'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="emptyState"
            :label="emptyState ? 'Empty State' : 'Chart Has Data'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="timeSeriesZoomToggle"
            :label="timeSeriesZoomToggle ? 'Zoom enabled' : 'Zoom disabled'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="thresholdToggle"
            :label="thresholdToggle ? 'Threshold enabled' : 'Threshold disabled'"
          />
        </div>
        <div v-if="thresholdToggle">
          <KInput
            v-model="thresholdValue"
            label="Error threshold"
            type="number"
          />
        </div>
        <br>

        <div class="config-container">
          <div class="flex-vertical">
            <button @click="exportCsv()">
              Custom export csv click handler
            </button>
            <CsvExportModal
              v-if="exportModalVisible"
              :export-state="exportState"
              filename="asdf.csv"
              @close-modal="setModalVisibility(false)"
            />
          </div>
        </div>

        <br>

        <label>Import chart data</label>
        <CodeText
          v-model="exploreResultText"
          :class="{ 'has-error': hasError, 'is-valid': isValid }"
        />
        <KButton
          size="small"
          @click="loadLatencyGatewayPreset()"
        >
          Load grouped latency preset
        </KButton>
        <KButton
          v-if="exploreResultText"
          size="small"
          @click="useGeneratedData()"
        >
          Use generated data
        </KButton>

        <div class="config-container">
          <div
            v-if="multiDimensionToggle"
            class="config-container-row"
          >
            <KLabel>Colors</KLabel>
            <div
              v-for="([label, color], i) in Object.entries(colorPalette)"
              :key="i"
              class="color-palette-section flex-vertical"
            >
              <label>{{ label }}</label>
              <input
                type="color"
                :value="color"
                @blur="updateSelectedColor($event, label)"
              >
            </div>
          </div>
        </div>
      </KCard>
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject, provide } from 'vue'
import {
  AnalyticsChart,
  ChartLegendPosition,
  CsvExportModal,
} from '../../src'
import type { AnalyticsExploreRecord, ExploreExportState, ExploreAggregations, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, AnalyticsChartOptions, ChartType, Threshold } from '../../src/types'
import { getStatusCodeDatasetColor, isValidJson, rand } from '../utils/utils'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import {
  generateData,
} from '@kong-ui-public/analytics-utilities'
import latencyGatewayPreset from '../fixtures/multiMetricDimensionTimeSeriesPreset.json'
import CodeText from '../CodeText.vue'
import { INJECT_QUERY_PROVIDER } from '../../src/constants'

enum Metrics {
  TotalRequests = 'TotalRequests',
  LatencyAverage = 'LatencyAverage',
  LatencyP99 = 'LatencyP99',
  ResponseSizeP99 = 'ResponseSizeP99',
}

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const timeSeriesZoomToggle = ref(true)
const stackToggle = ref(true)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showAnnotationsToggle = ref(true)
const showLegendValuesToggle = ref(true)
const emptyState = ref(false)
const thresholdToggle = ref(false)
const chartType = ref<ChartType>('timeseries_line')
const legendPosition = ref(ChartLegendPosition.Bottom)
const selectedMetricNames = ref<Metrics[]>([Metrics.TotalRequests])
const thresholdValue = ref(500)

const metricItemDefinitions = [{
  label: 'Total Requests',
  value: Metrics.TotalRequests,
  unit: 'count',
}, {
  label: 'Latency Average',
  value: Metrics.LatencyAverage,
  unit: 'ms',
}, {
  label: 'Latency P99',
  value: Metrics.LatencyP99,
  unit: 'ms',
}, {
  label: 'Response Size P99',
  value: Metrics.ResponseSizeP99,
  unit: 'bytes',
}]

const selectedMetric = computed(() => {
  const selected = metricItemDefinitions.find(item => item.value === selectedMetricNames.value[0]) ?? metricItemDefinitions[0]

  return {
    name: selected.value,
    unit: selected.unit,
  }
})

// Short labels
const statusCodeLabels = [
  '200', '300', '400', '500', '5XX', '____OTHER____', 'empty',
]

const statusCodeDimensionValues = ref(new Set(statusCodeLabels))

const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))

const threshold = computed(() => ({
  [selectedMetric.value.name]: [
    { type: 'error', value: thresholdValue.value, highlightIntersections: true },
  ],
} as Record<ExploreAggregations, Threshold[]>))

const exportModalVisible = ref(false)
const exportState = ref<ExploreExportState>({ status: 'loading' })

const setModalVisibility = (val: boolean) => {
  exportModalVisible.value = val

  if (!val) {
    exportState.value = { status: 'loading' }
  }
}
const exportCsv = () => {
  setModalVisibility(true)
  requestExport()
}

const requestExport = () => {
  // Simulate export data fetch for demo purposes
  if (emptyState.value) {
    exportState.value = { status: 'error', error: 'No data available for export.' }
  } else if (exploreResult.value.data.length > 0) {
    exportState.value = { status: 'success', chartData: exploreResult.value }
  } else {
    exportState.value = { status: 'error', error: 'Failed to fetch data for export.' }
  }
}

provide(INJECT_QUERY_PROVIDER, { evaluateFeatureFlagFn: () => true })

const exploreResultText = ref('')
const hasError = computed(() => !isValidJson(exploreResultText.value))
const isValid = computed(() => exploreResultText.value !== undefined &&
  exploreResultText.value !== '' &&
  isValidJson(exploreResultText.value))

const selectedMetrics = computed(() => selectedMetricNames.value.map(name => {
  const metric = metricItemDefinitions.find(item => item.value === name) ?? metricItemDefinitions[0]

  return {
    name: metric.value,
    unit: metric.unit,
  }
}))

const exploreResult = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
  }

  if (exploreResultText.value) {

    try {
      const result = JSON.parse(exploreResultText.value)

      return result as ExploreResultV4
    } catch {
      return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
    }
  }

  const metaOverrides: Partial<QueryResponseMeta> = {
    truncated: limitToggle.value,
    limit: limitToggle.value ? 10 : 50,
  }

  if (!selectedMetricNames.value.length) {
    return { data: [], meta: {} as QueryResponseMeta } as ExploreResultV4
  }

  return generateData({
    metrics: selectedMetrics.value,
    dimensionMap: multiDimensionToggle.value
      ? { statusCode: [...statusCodeDimensionValues.value] }
      : undefined,
    metaOverrides,
    timeSeries: true,
  })
})

const colorPalette = ref<AnalyticsChartColors>([...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: getStatusCodeDatasetColor(dimension) }), {}))

const updateSelectedColor = (event: Event, label: string) => {
  colorPalette.value[label] = (event.target as HTMLInputElement).value
}

const analyticsChartOptions = computed<AnalyticsChartOptions>(() => {
  return {
    type: chartType.value,
    stacked: stackToggle.value,
    threshold: thresholdToggle.value ? threshold.value : undefined,
    // chartDatasetColors: colorPalette.value,
  }
})

const preserveDimensionValuesOnEnable = ref(false)

const addDimension = () => {
  if (!multiDimensionToggle.value) {
    preserveDimensionValuesOnEnable.value = true
  }
  multiDimensionToggle.value = true

  const statusCode = `${rand(100, 599)}`
  statusCodeDimensionValues.value.add(statusCode)
  colorPalette.value[statusCode] = getStatusCodeDatasetColor(statusCode)
}

const dataCode = computed(() => JSON.stringify(exploreResult.value, null, 2))
const optionsCode = computed(() => JSON.stringify(analyticsChartOptions.value, null, 2))

const eventLog = ref('')

const onMetricsSelected = (items: Array<{ value: Metrics }>) => {
  selectedMetricNames.value = items.map(item => item.value)
}

const loadLatencyGatewayPreset = () => {
  exploreResultText.value = JSON.stringify(latencyGatewayPreset, null, 2)
  chartType.value = 'timeseries_line'
  stackToggle.value = false
  multiDimensionToggle.value = true
  emptyState.value = false
  selectedMetricNames.value = [Metrics.LatencyAverage, Metrics.LatencyP99]
}

const useGeneratedData = () => {
  exploreResultText.value = ''
}

watch(multiDimensionToggle, enabled => {
  if (!enabled) {
    preserveDimensionValuesOnEnable.value = false
    return
  }

  if (preserveDimensionValuesOnEnable.value) {
    preserveDimensionValuesOnEnable.value = false
    return
  }

  serviceDimensionValues.value = new Set(Array(5).fill(0).map(() => `Service${rand(1, 100)}`))
  statusCodeDimensionValues.value = new Set(statusCodeLabels)

  colorPalette.value = [...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: getStatusCodeDatasetColor(dimension) }), {})
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 20px;

  .chart-section {
    flex: 3;
  }

  .controls-section {
    flex: 1;
  }

  .dataset-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
