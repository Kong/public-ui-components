<template>
  <SandboxLayout
    :links="appLinks"
    title="Simple Charts"
  >
    <template #controls>
      <div class="flex-row-parent">
        <!-- AnalyticsChart / SimpleChart type selector -->
        <div class="flex-vertical">
          <KLabel>Chart Type</KLabel>
          <div class="chart-radio-group">
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
        <br>

        <!-- Metric display options (Gauge chart-specific) -->
        <div
          v-if="isGaugeChart"
          class="flex-vertical"
        >
          <KLabel>Metric display</KLabel>
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
          <br>

          <KLabel>Dataset order</KLabel>
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
          <br>

          <KLabel>Numerator</KLabel>
          <div class="chart-radio-group">
            <div>
              <KRadio
                v-model="gaugeNumerator"
                name="numerator"
                :selected-value="0"
              >
                0
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="gaugeNumerator"
                name="numerator"
                :selected-value="1"
              >
                1
              </KRadio>
            </div>
          </div>
        </div>
      </div>
      <br>

      <!-- Dataset options -->
      <div v-if="!isTopNTable">
        <KLabel>Dataset options</KLabel>
        <div class="dataset-options">
          <KButton
            appearance="secondary"
            class="first-button"
            size="small"
            @click="randomizeData()"
          >
            Randomize data
          </KButton>
          <KButton
            appearance="secondary"
            size="small"
            @click="addDataset()"
          >
            Add dataset
          </KButton>
        </div>
      </div>
      <br>

      <div class="option-toggles">
        <KLabel>Option toggles</KLabel>
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
      <br>

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
      </div>
    </template>

    <SimpleChart
      v-if="!isTopNTable"
      :chart-data="exploreResult"
      :chart-options="simpleChartOptions"
    />
    <TopNTable
      v-else
      class="top-n-sandbox"
      :data="topNTableData"
      description="Last 30-Day Summary"
      :is-loading="showLoadingState"
      title="Top 5 Routes"
    >
      <template #name="{ record }">
        <a href="#">{{ record.name }}</a>
      </template>
    </TopNTable>

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
import { computed, ref, watch, inject } from 'vue'
import {
  ChartMetricDisplay,
  ChartTypesSimple,
  SimpleChart,
  TopNTable,
} from '../../src'
import { SeededRandom } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsExploreRecord, DisplayBlob, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, SimpleChartOptions } from '../../src/types'
import { rand } from '../utils/utils'
import { lookupDatavisColor } from '../../src/utils'
import { lookupStatusCodeColor } from '../../src/utils/customColors'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import {
  KUI_STATUS_COLOR_2XX,
  KUI_STATUS_COLOR_3XX,
} from '@kong/design-tokens'

enum Metrics {
  TotalRequests = 'TotalRequests',
  LatencyP99 = 'LatencyP99',
  ResponseSizeP99 = 'ResponseSizeP99',
}

interface MetricSelection {
  name: Metrics,
  unit: string,
}

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const seed = ref(rand(10, 10000))

const multiMetricToggle = ref(false)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showLoadingState = ref(false)
const emptyState = ref(false)
const chartType = ref<ChartTypesSimple>(ChartTypesSimple.GAUGE)
const metricDisplay = ref(ChartMetricDisplay.Full)
const reverseDataset = ref(true)
const gaugeNumerator = ref(0)
const selectedMetric = ref<MetricSelection>({
  name: Metrics.TotalRequests,
  unit: 'count',
})

// Short labels
const statusCodeLabels = [
  '200', '300',
]

const statusCodeDimensionValues = ref(new Set(statusCodeLabels))

const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))

const exploreResult = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta }
  }

  const statusCodeDimensionType = 'StatusCode'
  const serviceDimensionType = 'Service'
  const rng = new SeededRandom(seed.value)

  const start = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
  const end = Date.now()

  const data: AnalyticsExploreRecord[] = []

  const dimensions = [...statusCodeDimensionValues.value]

  dimensions.forEach(statusCodeDimensionValue => {
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
        data.push(record)
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
      data.push(record)
    }
  })

  // V4 display blob
  const displayBlob: DisplayBlob = {}
  if (multiDimensionToggle.value) {
    displayBlob[serviceDimensionType] = {}

    serviceDimensionValues.value.forEach(val => {
      displayBlob[serviceDimensionType][val] = {
        name: val,
        deleted: false,
      }
    })
  }

  displayBlob[statusCodeDimensionType] = {}
  statusCodeDimensionValues.value.forEach(val => {
    displayBlob[statusCodeDimensionType][val] = {
      name: val,
      deleted: false,
    }
  })

  const meta: QueryResponseMeta = {
    start_ms: start,
    end_ms: end,
    granularity_ms: 86400000,
    query_id: '',
    truncated: limitToggle.value,
    limit: 50,
    metric_names: [selectedMetric.value.name, ...(multiMetricToggle.value ? ['secondaryMetric'] : [])],
    metric_units: {
      [selectedMetric.value.name]: selectedMetric.value.unit,
      ...(multiMetricToggle.value && { secondaryMetric: selectedMetric.value.unit }),
    },
    display: displayBlob,
  }

  return {
    // Gauge doughnut chart type should only receive 2 data points
    data: !isGaugeChart.value
      ? data
      : data.slice(0, 2),
    meta,
  }
})
const topNTableData = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return {
      meta: {} as QueryResponseMeta,
      data: [] as AnalyticsExploreRecord[],
    }
  }

  return {
    meta: {
      display: {
        route: {
          'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6': { name: 'GetMeAKongDefault (secondaryRuntime)', deleted: false },
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4': { name: 'dp-mock-msg-per-sec-us-dev (default)', deleted: false },
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca': { name: '8b1db (default)', deleted: false },
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b': { name: 'dp-mock-us-dev (default)', deleted: false },
          'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9': { name: 'GetMeASongRoute (default)', deleted: false },
        },
      },
      end_ms: 1692295253000,
      granularity_ms: 300000,
      limit: 50,
      metric_names: [
        'request_count',
      ],
      metric_units: {
        request_count: 'count',
      },
      query_id: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
      start_ms: 1692294953000,
    } as QueryResponseMeta,
    data: [
      {
        event: {
          request_count: 9483,
          route: 'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          request_count: 5587,
          route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          request_count: 5583,
          route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          request_count: 1485,
          route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
      {
        event: {
          request_count: 309,
          route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
        },
        timestamp: '2023-08-17T17:55:53.000Z',
      },
    ],
  } as ExploreResultV4
})

const colorPalette = ref<AnalyticsChartColors>([...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {}))

const twoColorPalette = ref<AnalyticsChartColors>({
  200: KUI_STATUS_COLOR_2XX,
  300: KUI_STATUS_COLOR_3XX,
})

const updateSelectedColor = (event: Event, label: string) => {
  colorPalette.value[label] = (event.target as HTMLInputElement).value
}

const simpleChartOptions = computed<SimpleChartOptions>(() => ({
  type: chartType.value,
  chartDatasetColors: twoColorPalette.value,
  metricDisplay: metricDisplay.value,
  reverseDataset: reverseDataset.value,
  numerator: gaugeNumerator.value,
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
const optionsCode = computed(() => JSON.stringify(simpleChartOptions.value, null, 2))

const isGaugeChart = computed<boolean>(() => {
  return (ChartTypesSimple.GAUGE === chartType.value)
})

const isTopNTable = computed<boolean>(() => {
  return (ChartTypesSimple.TOPN === chartType.value)
})

// const onMetricSelected = (item: any) => {
//   if (!item) {
//     return
//   }

//   selectedMetric.value = {
//     name: item.value,
//     unit: item.unit,
//   }
// }

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
@import '../styles/charts-sandbox';
</style>
