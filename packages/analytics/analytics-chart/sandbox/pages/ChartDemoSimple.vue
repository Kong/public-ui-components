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
                :selected-value="'gauge'"
              >
                Gauge
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="chartType"
                name="chartType"
                :selected-value="'top_n'"
              >
                Top N Table
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="chartType"
                name="chartType"
                :selected-value="'single_value'"
              >
                Single Value
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
                :selected-value="'single'"
              >
                single
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="metricDisplay"
                name="metricDisplay"
                :selected-value="'full'"
              >
                full
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="metricDisplay"
                name="metricDisplay"
                :selected-value="'hidden'"
              >
                hidden
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

        <div v-if="isTopNTable">
          <KLabel>Top&nbsp;N metric</KLabel>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'count'"
            >
              Requests (count)
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'ms'"
            >
              Latency (ms)
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'bytes'"
            >
              Response size (bytes)
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'usd'"
            >
              Cost (usd)
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'rpm'"
            >
              RPM (count/minute)
            </KRadio>
          </div>
          <div>
            <KRadio
              v-model="topNMetric"
              name="topNMetric"
              :selected-value="'fallback'"
            >
              Fallback (no metric_units)
            </KRadio>
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
        </div>
      </div>
      <br>

      <div class="option-toggles">
        <KLabel>Option toggles</KLabel>
        <div v-if="isTopNTable || isSingleValue">
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
    </template>

    <div
      v-if="!isTopNTable"
      class="simple-chart-sandbox"
      :class="{ 'single-value-sandbox': isSingleValue }"
    >
      <SimpleChart
        :chart-data="exploreResult"
        :chart-options="simpleChartOptions"
      />
    </div>
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
import { computed, ref, inject } from 'vue'
import {
  SimpleChart,
  type SimpleChartType,
  TopNTable,
} from '../../src'
import { generateCrossSectionalData } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsExploreRecord, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, SimpleChartOptions } from '../../src/types'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import type { SimpleChartMetricDisplay } from '../../src'

type TopNMetricKind = 'count' | 'ms' | 'bytes' | 'usd' | 'rpm' | 'fallback'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const showLoadingState = ref(false)
const emptyState = ref(false)
const chartType = ref<SimpleChartType>('gauge')
const metricDisplay = ref<SimpleChartMetricDisplay>('full')
const reverseDataset = ref(true)
const gaugeNumerator = ref(0)

const statusCodeDimensionValues = ref(new Set(['200', '300']))
const topNMetric = ref<TopNMetricKind>('count')

const exploreResult = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta }
  }

  return generateCrossSectionalData([{
    name: 'request_count',
    unit: 'count',
  }], { 'status_code': Array.from(statusCodeDimensionValues.value) })
})

const randomizeData = () => {
  // Randomize the data
  statusCodeDimensionValues.value = new Set([Math.floor(Math.random() * 1000).toString(), Math.floor(Math.random() * 1000).toString()])
}
const topNTableData = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return {
      meta: {} as QueryResponseMeta,
      data: [] as AnalyticsExploreRecord[],
    }
  }

  const display = {
    route: {
      'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6': { name: 'GetMeAKongDefault (secondaryRuntime)', deleted: false },
      'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9': { name: 'GetMeASongRoute (default)', deleted: false },
      'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca': { name: '8b1db (default)', deleted: false },
      'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b': { name: 'dp-mock-us-dev (default)', deleted: false },
      'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4': { name: 'dp-mock-msg-per-sec-us-dev (default)', deleted: false },
    },
  }

  let scenario: {
    metricKey: string
    unit?: string
    values: number[]
  }

  if (topNMetric.value === 'ms') {
    scenario = { metricKey: 'response_latency_average', unit: 'ms', values: [12.345, 9.8, 7.23, 3.456, 1.001] }
  } else if (topNMetric.value === 'bytes') {
    scenario = { metricKey: 'response_size_average', unit: 'bytes', values: [1_048_576, 512_000, 2_048, 128, 1] }
  } else if (topNMetric.value === 'usd') {
    scenario = { metricKey: 'cost', unit: 'usd', values: [12.3, 3.99, 0.00005, 0.42, 0.1] }
  } else if (topNMetric.value === 'rpm') {
    scenario = { metricKey: 'requests_per_minute', unit: 'count/minute', values: [98_765, 43_210, 2_100, 987, 12] }
  } else if (topNMetric.value === 'fallback') {
    scenario = { metricKey: 'request_count', values: [5_583, 1_485, 309, 42, 1] }
  } else {
    scenario = { metricKey: 'request_count', unit: 'count', values: [9_483, 5_587, 5_583, 1_485, 309] }
  }

  const meta: QueryResponseMeta = {
    display,
    end_ms: 1692295253000,
    granularity_ms: 300000,
    limit: 50,
    metric_names: [scenario.metricKey],
    query_id: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
    start_ms: 1692294953000,
  } as unknown as QueryResponseMeta

  if (scenario.unit) {
    meta.metric_units = { [scenario.metricKey]: scenario.unit }
  }

  const routeIds = Object.keys(display.route)
  const rows: AnalyticsExploreRecord[] = routeIds.map((routeId, idx) => {
    return {
      event: {
        [scenario.metricKey]: scenario.values[idx] ?? 0,
        route: routeId,
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    } as AnalyticsExploreRecord
  })

  return {
    meta,
    data: rows,
  } as ExploreResultV4
})


const twoColorPalette = ref<AnalyticsChartColors>({
  200: '#008871',
  300: '#9edca6',
})


const simpleChartOptions = computed<SimpleChartOptions>(() => ({
  type: chartType.value,
  chartDatasetColors: twoColorPalette.value,
  metricDisplay: metricDisplay.value,
  reverseDataset: reverseDataset.value,
  numerator: gaugeNumerator.value,
}))

const dataCode = computed(() => {
  const data = isTopNTable.value ? topNTableData.value : exploreResult.value

  return JSON.stringify(data, null, 2)
})
const optionsCode = computed(() => JSON.stringify(simpleChartOptions.value, null, 2))

const isGaugeChart = computed<boolean>(() => {
  return ('gauge' === chartType.value)
})

const isTopNTable = computed<boolean>(() => {
  return ('top_n' === chartType.value)
})

const isSingleValue = computed<boolean>(() => {
  return ('single_value' === chartType.value)
})

</script>

<style lang="scss" scoped>
@use "../styles/charts-sandbox";

.simple-chart-sandbox {
  &.single-value-sandbox {
    max-width: 100%;
    overflow-x: auto;
    resize: horizontal;
  }
}
</style>
