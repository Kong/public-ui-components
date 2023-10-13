<template>
  <div class="sandbox-container">
    <h1> Analytics Charts</h1>
    <div class="flex-row-parent">
      <!-- AnalyticsChart / SimpleChart type selector -->
      <div class="flex-vertical">
        <KLabel>
          Chart Type
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypes.HORIZONTAL_BAR"
            >
              Horizontal Bar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypes.VERTICAL_BAR"
            >
              VerticalBar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypes.TIMESERIES_LINE"
            >
              Timeseries Line
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypes.TIMESERIES_BAR"
            >
              Timeseries Bar
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypes.DOUGHNUT"
            >
              Doughnut
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypesSimple.GAUGE"
            >
              Gauge
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="chartType"
              name="chartType"
              :selected-value="ChartTypesSimple.TOPN"
            >
              Top N Table
            </KRadio>
          </div>
        </div>
      </div>

      <!-- Metric display options (Gauge chart-specific) -->
      <div
        v-if="isGaugeChart"
        class="flex-vertical"
      >
        <KLabel>
          Metric display
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="metricDisplay"
              name="metricDisplay"
              :selected-value="ChartMetricDisplay.SingleMetric"
            >
              {{ ChartMetricDisplay.SingleMetric }}
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="metricDisplay"
              name="metricDisplay"
              :selected-value="ChartMetricDisplay.Full"
            >
              {{ ChartMetricDisplay.Full }}
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="metricDisplay"
              name="metricDisplay"
              :selected-value="ChartMetricDisplay.Hidden"
            >
              {{ ChartMetricDisplay.Hidden }}
            </KRadio>
          </div>
        </div>
        <KLabel>
          Dataset order
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="reverseDataset"
              name="reverseDataset"
              :selected-value="false"
            >
              Normal
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="reverseDataset"
              name="reverseDataset"
              :selected-value="true"
            >
              Reversed
            </KRadio>
          </div>
        </div>
        <KLabel>
          Big Number Key
        </KLabel>
        <div class="chart-radio-group">
          <div>
            <KRadio
              v-model="bigNumberKey"
              name="bigNumberKey"
              :selected-value="0"
            >
              0
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="bigNumberKey"
              name="bigNumberKey"
              :selected-value="1"
            >
              1
            </KRadio>
          </div>
        </div>
      </div>

      <!-- Legend position -->
      <div
        v-if="!isSimpleChart"
        class="flex-vertical"
      >
        <KLabel>
          Legend position
        </KLabel>
        <div class="chart-radio-group">
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
      </div>
      <!-- Metric item selection -->
      <KSelect
        :items="metricItems"
        label="Metric"
        placeholder="Select Metric"
        @selected="onMetricSelected"
      />
    </div>

    <!-- Determine if a full blown chart is to be displayed, or a simplified one -->
    <AnalyticsChart
      v-if="!isSimpleChart"
      :chart-data="exploreResult"
      :chart-options="analyticsChartOptions"
      chart-title="Request count by Status Code"
      :legend-position="legendPosition"
      :show-annotations="showAnnotationsToggle"
      :show-legend-values="showLegendValuesToggle"
      tooltip-title="tooltip title"
    />
    <SimpleChart
      v-else-if="!isTopNTable"
      :chart-data="exploreResult"
      :chart-options="simpleChartOptions"
      :legend-position="legendPosition"
    />
    <TopNTable
      v-if="isTopNTable"
      class="top-n-sandbox"
      :data="exploreResultV3"
      description="Last 30-Day Summary"
      :is-loading="showLoadingState"
      title="Top 5 Routes"
    >
      <template #name="{ record }">
        <a href="#">{{ record.name }}</a>
      </template>
    </TopNTable>

    <!-- Dataset options -->
    <div
      v-if="!isTopNTable"
      class="dataset-options"
    >
      <KButton
        appearance="outline"
        class="first-button"
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
      <div v-if="!isSimpleChart">
        <KInputSwitch
          v-model="multiMetricToggle"
          :label="multiMetricToggle ? 'Multi Metric' : 'Single Metric'"
        />
      </div>
      <div v-if="!chartType.includes('TimeSeries') && !isSimpleChart">
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
      <div v-if="!isSimpleChart">
        <KInputSwitch
          v-model="stackToggle"
          :label="stackToggle ? 'Stacked' : 'Not Stacked'"
        />
      </div>
      <div v-if="!isTimeSeriesChart && !isSimpleChart">
        <KInputSwitch
          v-model="showAnnotationsToggle"
          :label="showAnnotationsToggle ? 'Show Annotations' : 'No Annotations'"
        />
      </div>
      <div v-if="!isSimpleChart">
        <KInputSwitch
          v-model="showLegendValuesToggle"
          :label="showLegendValuesToggle ? 'Show Legend Values' : 'No Legend Values'"
        />
      </div>
      <div v-if="!isSimpleChart">
        <KInputSwitch
          v-model="limitToggle"
          :label="limitToggle ? 'Has Limit' : 'No Limit'"
        />
      </div>
      <div v-if="isTopNTable">
        <KInputSwitch
          v-model="showLoadingState"
          :label="showLoadingState ? 'Is Loading' : 'Data Loaded'"
        />
      </div>
      <div>
        <KInputSwitch
          v-model="emptyState"
          :label="emptyState ? 'Empty State' : 'Chart Has Data'"
        />
      </div>
    </div>
    <div class="config-container">
      <div
        v-if="!isTopNTable"
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
import { AnalyticsChart, ChartMetricDisplay, ChartLegendPosition, ChartTypes, ChartTypesSimple, SimpleChart, TopNTable } from '../src'
import type { AnalyticsExploreRecord, AnalyticsExploreV2Meta, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, AnalyticsChartOptions, SimpleChartOptions } from '../src/types'
import { SeededRandom } from './SeedRandom'
import { rand } from './utils'
import { lookupDatavisColor } from '../src/utils'
import { lookupStatusCodeColor } from '../src/utils/customColors'

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

const multiMetricToggle = ref(false)
const fillToggle = ref(true)
const stackToggle = ref(true)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showAnnotationsToggle = ref(true)
const showLegendValuesToggle = ref(true)
const showLoadingState = ref(false)
const emptyState = ref(false)
const chartType = ref<ChartTypes | ChartTypesSimple>(ChartTypes.VERTICAL_BAR)
const legendPosition = ref(ChartLegendPosition.Right)
const metricDisplay = ref(ChartMetricDisplay.SingleMetric)
const reverseDataset = ref(false)
const bigNumberKey = ref(0)
const selectedMetric = ref<MetricSelection>({
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

// Short labels
const statusCodeLabels = [
  '200', '300', '400', '500',
]

// Long labels
// const statusCodeLabels = [
//   'getmeakong123', 'getmeakong123123', 'testservice1233', 'testtesttest123123', 'This is a really long chart label to test long labels',
// ]
const statusCodeDimensionValues = ref(new Set(statusCodeLabels))

const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))
const exploreResult = computed<AnalyticsExploreV2Result | null>(() => {
  if (emptyState.value) {
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

      if (!multiMetricToggle.value) {
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
              ...(multiDimensionToggle.value && { [statusCodeDimensionType]: statusCode }),
              [selectedMetric.value.name]: statusCount,
            },
          }
          records.push(record)
        }
      } else {
        const record = {
          version: '1.0',
          timestamp: new Date(i).toISOString(),
          event: {
            [selectedMetric.value.name]: rng.next(100000, 2000000),
            secondaryMetric: rng.next(100000, 2000000),
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
        ...(!multiMetricToggle.value && multiDimensionToggle.value && { [statusCodeDimensionType]: [...statusCodeDimensionValues.value] }),
      },
      metricNames: [selectedMetric.value.name, ...(multiMetricToggle.value ? ['secondaryMetric'] : [])],
      metricUnits: {
        [selectedMetric.value.name]: selectedMetric.value.unit,
        ...(multiMetricToggle.value && { secondaryMetric: selectedMetric.value.unit }),
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
              ...(multiMetricToggle.value && { secondaryMetric: rng.next(100000, 2000000) }),
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
            ...(multiMetricToggle.value && { secondaryMetric: rng.next(100000, 2000000) }),
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
      truncated: limitToggle.value,
      limit: 50,
      metricNames: [selectedMetric.value.name, ...(multiMetricToggle.value ? ['secondaryMetric'] : [])],
      metricUnits: {
        [selectedMetric.value.name]: selectedMetric.value.unit,
        ...(multiMetricToggle.value && { secondaryMetric: selectedMetric.value.unit }),
      },
      dimensions: {
        ...(multiDimensionToggle.value && { [serviceDimensionType]: [...serviceDimensionValues.value] }),
        [statusCodeDimensionType]: [...statusCodeDimensionValues.value],
      },
    }
  }

  return {
    // Gauge doughnut chart type should only receive 2 data points
    records: !isGaugeChart.value
      ? records
      // @ts-ignore - merely sorting the array for display purposes
      : records.slice(0, 2).sort((a, b) => (a[selectedMetric.value.name] < b[selectedMetric.value.name])),
    meta,
  }
})
const exploreResultV3 = computed(() => {
  if (emptyState.value) {
    return {
      meta: {},
      records: [],
    }
  }

  return {
    meta: {
      display: {
        ROUTE: {
          'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6': 'GetMeAKongDefault (secondaryRuntime)',
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4': 'dp-mock-msg-per-sec-us-dev (default)',
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca': '8b1db (default)',
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b': 'dp-mock-us-dev (default)',
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9': 'GetMeASongRoute (default)',
        },
      },
      endMs: 1692295253000,
      granularity: 300000,
      limit: 50,
      metricNames: [
        'REQUEST_COUNT',
      ],
      metricUnits: {
        REQUEST_COUNT: 'count',
      },
      queryId: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
      startMs: 1692294953000,
      truncated: false,
    },
    records: [
      {
        event: {
          REQUEST_COUNT: 9483,
          ROUTE: 'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          REQUEST_COUNT: 5587,
          ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          REQUEST_COUNT: 5583,
          ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          REQUEST_COUNT: 1485,
          ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          REQUEST_COUNT: 309,
          ROUTE: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
    ],
  }
})

const colorPalette = ref<AnalyticsChartColors>([...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {}))

const twoColorPalette = ref<AnalyticsChartColors>({
  200: '#008871',
  300: '#9edca6',
})

const updateSelectedColor = (event: Event, label: string) => {
  colorPalette.value[label] = (event.target as HTMLInputElement).value
}

const analyticsChartOptions = computed<AnalyticsChartOptions>(() => ({
  type: chartType.value,
  stacked: stackToggle.value,
  fill: fillToggle.value,
  chartDatasetColors: colorPalette.value,
  isSimple: isSimpleChart.value,
}))

const simpleChartOptions = computed<SimpleChartOptions>(() => ({
  type: chartType.value,
  chartDatasetColors: twoColorPalette.value,
  metricDisplay: metricDisplay.value,
  reverseDataset: reverseDataset.value,
  bigNumberKey: bigNumberKey.value,
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

const isTimeSeriesChart = computed<boolean>(() => {
  return [ChartTypes.TIMESERIES_BAR, ChartTypes.TIMESERIES_LINE].some(e => e === chartType.value)
})

const isSimpleChart = computed<boolean>(() => {
  return [ChartTypesSimple.GAUGE, ChartTypesSimple.TOPN].some(e => e === chartType.value)
})

const isGaugeChart = computed<boolean>(() => {
  return (ChartTypesSimple.GAUGE === chartType.value)
})

const isTopNTable = computed<boolean>(() => {
  return (ChartTypesSimple.TOPN === chartType.value)
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

watch(multiDimensionToggle, () => {
  serviceDimensionValues.value = new Set(Array(5).fill(0).map(() => `Service${rand(1, 100)}`))
  statusCodeDimensionValues.value = new Set(statusCodeLabels)

  colorPalette.value = [...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {})
})

watch(isGaugeChart, () => {
  // Truncate labels if Gauge (simplified doughnut) chart type
  if (isGaugeChart.value) {
    statusCodeDimensionValues.value = new Set(statusCodeLabels.slice(0, 2))
  }
})

</script>

<style lang="scss" scoped>
@import '../src/styles/base';
html,
body {
  background-color: #f1f1f5;
  height: 100%;
  margin: 0;
  min-height: 100%;
  padding: 0;
  width: 100%;
}
.sandbox-container {
  margin: 0;
  padding: $kui-space-60;

  .k-input-label{
    margin-bottom: 2px;

    &:not(:first-child) {
      margin-top: 12px;
    }
  }

  .top-n-sandbox {
    margin-top: 16px;
    margin-bottom: 16px;
  }

  h1 {
    margin-top: 0;
  }
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
    gap: 24px;
  }

  .config-container {
    display: flex;
    gap: 24px;
    padding: $kui-space-60;
    --KCodeBlockFontSize: 15px;

    .config-container-row {
      flex-direction: row;
    }

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

.dataset-options {
  display: flex;
  flex-direction: row;

  .first-button {
    margin-right: 8px;
  }
}
</style>
