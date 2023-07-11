<template>
  <div class="sandbox-container">
    <h1> Analytics Charts</h1>
    <div class="flex-row-parent">
      <div class="flex-vertical">
        <KLabel>
          Chart Type
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="chartType"
              data-testid="service-radio-btn"
              name="chartType"
              :selected-value="ChartTypes.HORIZONTAL_BAR"
            >
              Horizontal Bar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              data-testid="route-radio-btn"
              name="chartType"
              :selected-value="ChartTypes.VERTICAL_BAR"
            >
              VerticalBar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              data-testid="application-radio-btn"
              name="chartType"
              :selected-value="ChartTypes.TIMESERIES_LINE"
            >
              Timeseries Line
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              data-testid="application-radio-btn"
              name="chartType"
              :selected-value="ChartTypes.TIMESERIES_BAR"
            >
              Timeseries Bar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              data-testid="application-radio-btn"
              name="chartType"
              :selected-value="ChartTypes.DOUGHNUT"
            >
              Doughnut
            </KRadio>
          </div>
        </div>
      </div>
      <div class="flex-vertical">
        <KLabel>
          Legend position
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="legendPosition"
              data-testid="service-radio-btn"
              name="legendPosition"
              :selected-value="ChartLegendPosition.Right"
            >
              {{ ChartLegendPosition.Right }}
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="legendPosition"
              data-testid="route-radio-btn"
              name="legendPosition"
              :selected-value="ChartLegendPosition.Bottom"
            >
              {{ ChartLegendPosition.Bottom }}
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="legendPosition"
              data-testid="application-radio-btn"
              name="legendPosition"
              :selected-value="ChartLegendPosition.Hidden"
            >
              {{ ChartLegendPosition.Hidden }}
            </KRadio>
          </div>
        </div>
      </div>
      <KSelect
        :items="metricItems"
        label="Metric"
        placeholder="Select Metric"
        @selected="onMetricSelected"
      />
    </div>
    <AnalyticsChart
      :chart-data="exploreResult"
      :chart-options="analyticsChartOptions"
      chart-title="Request count by Status Code"
      :legend-position="legendPosition"
      :show-annotations="showAnnotationsToggle"
      :show-legend-values="showLegendValuesToggle"
      tooltip-title="tooltip title"
    />
    <div class="d-flex flex-row">
      <KButton
        appearance="outline"
        class="mr-2"
        @click="randomizeData()"
      >
        Randomize data
      </KButton>
      <KButton
        appearance="outline"
        @click="addDataset()"
      >
        Add dataset
      </KButton>
    </div>
    <div class="option-toggles">
      <KLabel>
        Option toggles
      </KLabel>
      <div v-if="!chartType.includes('TimeSeries')">
        <KInputSwitch
          v-model="multiDimensionToggle"
          :label="multiDimensionToggle ? 'Multi Dimension' : 'Single Dimension'"
        />
      </div>
      <div v-if="chartType.includes('Line')">
        <KInputSwitch
          v-model="fillToggle"
          :label="fillToggle ? 'Fill' : 'No Fill'"
        />
      </div>
      <div v-if="isTimeSeriesChart">
        <KInputSwitch
          v-model="stackToggle"
          :label="stackToggle ? 'Stacked' : 'Not Stacked'"
        />
      </div>
      <div v-if="!isTimeSeriesChart">
        <KInputSwitch
          v-model="showAnnotationsToggle"
          :label="showAnnotationsToggle ? 'Show Annotations' : 'No Annotations'"
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
          v-model="showEmptyStateToggle"
          :label="showEmptyStateToggle ? 'No Data' : 'Chart Has Data'"
        />
      </div>
      <div v-if="chartType.includes('Doughnut')">
        <KInputSwitch
          v-model="showTotalToggle"
          :label="showTotalToggle ? 'Hide Totals' : 'Show Totals'"
        />
      </div>
    </div>
    <div class="config-container d-flex">
      <div class="flex-row">
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
      <div class="data-container">
        <KLabel>ChartData</KLabel>
        <KCodeBlock
          v-if="dataCode"
          id="data-codeblock"
          :code="dataCode"
          is-searchable
          language="json"
        />
      </div>
      <div class="options-container">
        <KLabel>Chart Options</KLabel>
        <KCodeBlock
          v-if="optionsCode"
          id="options-codeblock"
          :code="optionsCode"
          is-searchable
          language="json"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AnalyticsChart, ChartLegendPosition, ChartTypes } from '../src'
import type { AnalyticsExploreRecord, AnalyticsExploreV2Meta, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, AnalyticsChartOptions } from '../src/types'
import { SeededRandom } from './SeedRandom'
import { rand } from './utils'
import { lookupDatavisColor } from '../src/utils'
import { lookupStatusCodeColor } from '../src/utils/customColors'

// why is eslint unused vars broken?? ¯\_(ツ)_/¯
/* eslint-disable no-unused-vars */
enum Metrics {
  TotalRequests = 'TotalRequests',
  LatencyP99 = 'LatencyP99',
  ResponseSizeP99 = 'ResponseSizeP99',
}

interface MetricSelection {
  name: Metrics,
  unit: string,
}

const seed = ref(rand(10, 10000))

const fillToggle = ref(true)
const stackToggle = ref(true)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showAnnotationsToggle = ref(true)
const showLegendValuesToggle = ref(true)
const showEmptyStateToggle = ref(false)
const showTotalToggle = ref(false)
const chartType = ref(ChartTypes.DOUGHNUT)
const legendPosition = ref(ChartLegendPosition.Right)
const selectedMetric = ref< MetricSelection>({
  name: Metrics.TotalRequests,
  unit: 'count',
})

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
  label: ' Response Size P99',
  value: Metrics.ResponseSizeP99,
  unit: 'bytes',
}]
const statusCodeDimensionValues = ref(new Set([
  '200', '300', '400', '500', 'This is a really long chart label to test long labels',
]))
const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))
const exploreResult = computed<AnalyticsExploreV2Result | null>(() => {
  if (showEmptyStateToggle.value) {
    return null
  }

  const statusCodeDimensionType = 'StatusCode'
  const serviceDimensionType = 'Service'
  const rng = new SeededRandom(seed.value)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()

  const records: AnalyticsExploreRecord[] = []
  let meta: AnalyticsExploreV2Meta
  let totalRequests = 0
  if (isTimeSeriesChart.value) {
    for (let i = start; i <= end; i += 60 * 60 * 1000) { // 1 hour apart
      totalRequests += rng.next(50, 500)
      for (let j = 0; j < statusCodeDimensionValues.value.size; j++) {
        const statusCode = [...statusCodeDimensionValues.value][j]
        const getStatusCount = (statusCode: string) => {
        // Mostly 2xx then 3xx then 4xx than 5xx
          if (/^2\d\d$/.test(statusCode)) {
            return totalRequests * (rand(7, 9) / 10)
          } else if (/^3\d\d$/.test(statusCode)) {
            return totalRequests * (rand(4, 6) / 10)
          } else if (/^4\d\d$/.test(statusCode)) {
            return totalRequests * (rand(3, 5) / 10)
          } else if (/^5\d\d$/.test(statusCode)) {
            return totalRequests * (rand(1, 2) / 10)
          } else {
            return Math.floor(totalRequests * 0.02)
          }
        }
        const statusCount = getStatusCount(statusCode)
        const record = {
          version: '1.0',
          timestamp: new Date(i).toISOString(),
          event: {
            [statusCodeDimensionType]: statusCode,
            [selectedMetric.value.name]: statusCount,
          },
        }
        records.push(record)
      }
    }

    meta = {
      startMs: start,
      endMs: end,
      queryId: '12345',
      dimensions: {
        [statusCodeDimensionType]: [...statusCodeDimensionValues.value],
      },
      metricNames: [selectedMetric.value.name],
      metricUnits: {
        [selectedMetric.value.name]: selectedMetric.value.unit,
      },
      granularity: 60 * 60 * 1000, // 1 hour in ms
      truncated: limitToggle.value,
      limit: 10,
    }
  } else {
    [...statusCodeDimensionValues.value].forEach(statusCodeDimensionValue => {
      if (multiDimensionToggle.value) {
        [...serviceDimensionValues.value].forEach(serviceDimensionValue => {
          const timestamp = new Date().toISOString()
          const version = 'v1'
          const statusCount = rng.next(100000, 2000000)
          const record = {
            version,
            timestamp,
            event: {
              [serviceDimensionType]: serviceDimensionValue,
              [statusCodeDimensionType]: statusCodeDimensionValue,
              [selectedMetric.value.name]: statusCount,
            },
          }
          records.push(record)
        })
      } else {
        const timestamp = new Date().toISOString()
        const version = 'v1'
        const statusCount = rng.next(100000, 2000000)
        const record = {
          version,
          timestamp,
          event: {
            [statusCodeDimensionType]: statusCodeDimensionValue,
            [selectedMetric.value.name]: statusCount,
          },
        }
        records.push(record)
      }
    })

    meta = {
      startMs: start,
      endMs: end,
      granularity: 86400000,
      queryId: '',
      metricNames: [selectedMetric.value.name],
      truncated: limitToggle.value,
      limit: 50,
      metricUnits: {
        [selectedMetric.value.name]: selectedMetric.value.unit,
      },
      dimensions: {
        ...(multiDimensionToggle.value && { [serviceDimensionType]: [...serviceDimensionValues.value] }),
        [statusCodeDimensionType]: [...statusCodeDimensionValues.value],
      },
    }
  }

  return {
    records: showTotalToggle.value ? records.slice(0, 2) : records,
    meta,
  }
})

const colorPalette = ref<AnalyticsChartColors>([...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {}))

const updateSelectedColor = (event: Event, label: string) => {
  colorPalette.value[label] = (event.target as HTMLInputElement).value
}

const analyticsChartOptions = computed<AnalyticsChartOptions>(() => ({
  type: chartType.value,
  stacked: stackToggle.value,
  fill: fillToggle.value,
  chartDatasetColors: colorPalette.value,
  showTotal: showTotalToggle.value,
}))

const randomizeData = () => {
  seed.value = rand(10, 10000)
}

const addDataset = () => {
  const statusCode = `${rand(100, 599)}`
  statusCodeDimensionValues.value.add(statusCode)
  colorPalette.value[statusCode] = lookupStatusCodeColor(statusCode)

  const service = `Service${rand(1, 100)}`
  serviceDimensionValues.value.add(service)
}

const dataCode = computed(() => JSON.stringify(exploreResult.value, null, 2))
const optionsCode = computed(() => JSON.stringify(analyticsChartOptions.value, null, 2))

watch(multiDimensionToggle, () => {
  serviceDimensionValues.value = new Set(Array(5).fill(0).map(() => `Service${rand(1, 100)}`))
  statusCodeDimensionValues.value = new Set(Array(5).fill(0).map(() => `${rand(100, 599)}`))

  colorPalette.value = [...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {})
})

const isTimeSeriesChart = computed<boolean>(() => {
  return [ChartTypes.TIMESERIES_BAR, ChartTypes.TIMESERIES_LINE].some(e => e === chartType.value)
})

const onMetricSelected = (item: any) => {
  if (!item) {
    return
  }

  selectedMetric.value = {
    name: item.value,
    unit: item.unit,
  }
}

</script>

<style lang="scss" scoped>
@import '../src/styles/base';
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #f1f1f5;
  min-height: 100%;
}
.sandbox-container {
  min-height: 540px;
  margin: $spacing-md;
  padding: $spacing-md;

  @media (max-width: 767px) {
    min-height: 300px;
    width: 100%;
  }
  .chart-radio-group {
    .k-radio {
      margin-top: 4px;
    }
  }

  .option-toggles {
    margin: 24px 12px;
  }
  .flex-row-parent {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }

  .config-container {
    display: flex;
    gap: 24px;
    padding: $spacing-md;
    --KCodeBlockFontSize: 15px;
    .data-container {
      width: 50%;
    }

    .flex-vertical {
      display: flex;
      flex-direction: column;
    }

    .options-container {
      width: 50%;
    }
  }
}
</style>
