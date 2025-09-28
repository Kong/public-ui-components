<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
  >
    <template #controls>
      <div class="sandbox-container">
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
                :selected-value="ChartLegendPosition.Right"
              >
                {{ ChartLegendPosition.Right }}
              </KRadio>
            </div>
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
          <KSelect
            :items="metricItems"
            label="Metric"
            placeholder="Select Metric"
            @selected="onMetricSelected"
          />
        </div>

        <!-- Dataset options -->
        <KLabel>Dataset options</KLabel>
        <div class="dataset-options">
          <KButton
            size="small"
            @click="addDataset()"
          >
            Add dataset
          </KButton>
        </div>

        <KLabel>Option toggles</KLabel>
        <div>
          <KInputSwitch
            v-model="multiDimensionToggle"
            :label="multiDimensionToggle ? 'Multi Dimension' : 'Single Dimension'"
          />
        </div>
        <div v-if="!multiDimensionToggle">
          <KInputSwitch
            v-model="multiMetricToggle"
            :label="multiMetricToggle ? 'Multi Metric' : 'Single Metric'"
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
          <KInput
            v-model="thresholdValue"
            label="Eror threshold"
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
              @toggle-modal="setModalVisibility"
            />
          </div>
        </div>

        <br>

        <label>Import chart data</label>
        <CodeText
          v-model="exploreResultText"
          :class="{ 'has-error': hasError, 'is-valid': isValid }"
        />

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
      </div>
    </template>

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
import { isValidJson, rand } from '../utils/utils'
import { lookupDatavisColor } from '../../src/utils'
import { lookupStatusCodeColor } from '../../src/utils/customColors'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { generateMultipleMetricTimeSeriesData, generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import CodeText from '../CodeText.vue'
import { INJECT_QUERY_PROVIDER } from '../../src/constants'

enum Metrics {
  TotalRequests = 'TotalRequests',
  LatencyP99 = 'LatencyP99',
  ResponseSizeP99 = 'ResponseSizeP99',
}

interface MetricSelection {
  name: Metrics
  unit: string
}

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const timeSeriesZoomToggle = ref(true)
const multiMetricToggle = ref(false)
const stackToggle = ref(true)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showAnnotationsToggle = ref(true)
const showLegendValuesToggle = ref(true)
const emptyState = ref(false)
const chartType = ref<ChartType>('timeseries_line')
const legendPosition = ref(ChartLegendPosition.Bottom)
const secondaryMetrics = ref([{ name: 'secondaryMetric', unit: 'count' }])
const selectedMetric = ref<MetricSelection>({
  name: Metrics.TotalRequests,
  unit: 'count',
})
const thresholdValue = ref(500)

const metricItems = [{
  label: 'Total Requests',
  value: Metrics.TotalRequests,
  unit: 'count',
  selected: true,
}, {
  label: 'Latency P99',
  value: Metrics.LatencyP99,
  unit: 'ms',
}, {
  label: 'Response Size P99',
  value: Metrics.ResponseSizeP99,
  unit: 'bytes',
}]

// Short labels
const statusCodeLabels = [
  '200', '300', '400', '500', '5XX', 'empty',
]

const statusCodeDimensionValues = ref(new Set(statusCodeLabels))

const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))

const threshold = computed(() => ({
  'request_count': [
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

  if (multiDimensionToggle.value) {
    return generateSingleMetricTimeSeriesData({ name: selectedMetric.value.name, unit: selectedMetric.value.unit },
      {
        statusCode: [...statusCodeDimensionValues.value],
      },
      metaOverrides,
    )
  } else if (multiMetricToggle.value) {
    return generateMultipleMetricTimeSeriesData([{ name: selectedMetric.value.name, unit: selectedMetric.value.unit }, ...secondaryMetrics.value], metaOverrides)
  }
  return generateSingleMetricTimeSeriesData({ name: selectedMetric.value.name, unit: selectedMetric.value.unit }, undefined, metaOverrides)
})

const colorPalette = ref<AnalyticsChartColors>([...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {}))

const updateSelectedColor = (event: Event, label: string) => {
  colorPalette.value[label] = (event.target as HTMLInputElement).value
}

const analyticsChartOptions = computed<AnalyticsChartOptions>(() => {
  return {
    type: chartType.value,
    stacked: stackToggle.value,
    threshold: threshold.value,
    // chartDatasetColors: colorPalette.value,
  }
})

const addDataset = () => {

  if (multiDimensionToggle.value) {
    const statusCode = `${rand(100, 599)}`
    statusCodeDimensionValues.value.add(statusCode)
    colorPalette.value[statusCode] = lookupStatusCodeColor(statusCode)

    const service = `Service${rand(1, 100)}`
    serviceDimensionValues.value.add(service)
  } else if (multiMetricToggle.value) {
    const metric = `Metric${rand(1, 100)}`
    secondaryMetrics.value.push({ name: metric, unit: 'count' })
  }
}

const dataCode = computed(() => JSON.stringify(exploreResult.value, null, 2))
const optionsCode = computed(() => JSON.stringify(analyticsChartOptions.value, null, 2))

const eventLog = ref('')

const onMetricSelected = (item: any) => {
  if (!item) {
    return
  }

  selectedMetric.value = {
    name: item.value,
    unit: item.unit,
  }
}

watch(multiDimensionToggle, () => {
  serviceDimensionValues.value = new Set(Array(5).fill(0).map(() => `Service${rand(1, 100)}`))
  statusCodeDimensionValues.value = new Set(statusCodeLabels)

  colorPalette.value = [...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {})
})
</script>

<style lang="scss" scoped>
@use "../styles/charts-sandbox";
</style>
