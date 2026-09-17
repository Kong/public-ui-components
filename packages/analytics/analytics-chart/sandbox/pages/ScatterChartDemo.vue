<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
  >
    <template #controls>
      <div class="flex-row-parent">
        <div class="flex-vertical">
          <KLabel>Legend position</KLabel>
          <div class="chart-radio-group">
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
        <div class="flex-vertical">
          <KLabel>X axis</KLabel>
          <div class="chart-radio-group">
            <div>
              <KRadio
                v-model="xAxis"
                name="xAxis"
                selected-value="time"
              >
                Time
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="xAxis"
                name="xAxis"
                selected-value="metric"
              >
                Request count
              </KRadio>
            </div>
          </div>
        </div>
      </div>
      <br>

      <div class="option-toggles">
        <KLabel>Option toggles</KLabel>
        <div>
          <KInputSwitch
            v-model="percentileLinesToggle"
            :label="percentileLinesToggle ? 'Percentile lines' : 'No percentile lines'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="outlierToggle"
            :label="outlierToggle ? 'Highlight outliers' : 'No outlier highlighting'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="shadeToggle"
            :label="shadeToggle ? 'Shade outlier region' : 'No shading'"
          />
        </div>
        <div>
          <KInputSwitch
            v-model="groupedToggle"
            :label="groupedToggle ? `Grouped by ${isMetricXAxis ? 'model' : 'route'}` : 'Single series'"
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

      <KInput
        v-model.number="jitterMinutes"
        label="Jitter (minutes)"
        min="0"
        type="number"
      />
      <br>
      <KInput
        v-model.number="outlierPercentile"
        label="Outlier percentile"
        max="100"
        min="0"
        type="number"
      />
      <br>
      <KInput
        v-model.number="recordCount"
        label="Records"
        min="0"
        type="number"
      />
      <br>
      <KInput
        v-model.number="pointOpacity"
        label="Point opacity"
        max="1"
        min="0"
        step="0.1"
        type="number"
      />
    </template>

    <div style="height: 500px;">
      <AnalyticsChart
        :chart-data="isMetricXAxis ? exploreData : requestsData"
        :chart-options="analyticsChartOptions"
        :legend-position="legendPosition"
        :show-legend-values="true"
        :tooltip-title="isMetricXAxis ? 'Requests vs cost' : 'Cost'"
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
import type { Display, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import type { AnalyticsChartOptions } from '../../src/types'
import type { ScatterChartData, ScatterDataPoint } from '../../src/types'

import { computed, inject, ref } from 'vue'
import { KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'

import { AnalyticsChart, ChartLegendPosition } from '../../src'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const pointColor = ref(KUI_COLOR_TEXT_NEUTRAL)

const legendPosition = ref(ChartLegendPosition.Bottom)
const percentileLinesToggle = ref(false)
const outlierToggle = ref(false)
const shadeToggle = ref(false)
const groupedToggle = ref(false)
const emptyState = ref(false)
const jitterMinutes = ref(90)
const outlierPercentile = ref(95)
const recordCount = ref(800)
const pointOpacity = ref(0.6)
const xAxis = ref<'time' | 'metric'>('time')
const isMetricXAxis = computed(() => xAxis.value === 'metric')

const DAY_MS = 24 * 60 * 60 * 1000
const ROUTES = ['route-a', 'route-b']
const end = new Date('2024-06-23T00:00:00.000Z')
const start = new Date(end.valueOf() - 7 * DAY_MS)

const costFor = (): number => {
  const u1 = Math.max(Math.random(), 1e-6)
  const u2 = Math.random()
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

  return Math.round(Math.exp(-3.4 + 0.75 * normal) * 1e4) / 1e4
}

// Cluster most records into the first three days, matching real bursty traffic.
const timestampFor = (): number => {
  const clustered = Math.random() < 0.8
  const dayOffset = clustered ? Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 4)

  return start.valueOf() + dayOffset * DAY_MS + Math.random() * DAY_MS
}

// One point per record, plus a second for roughly a third of them. Real sources unroll
// nested collections the same way, so a request that invokes two AI plugins contributes
// two points sharing its timestamp.
const points = computed<ScatterDataPoint[]>(() => {
  if (emptyState.value) {
    return []
  }

  const built: ScatterDataPoint[] = []

  for (let i = 0; i < Math.max(0, recordCount.value); i++) {
    const timestamp = timestampFor()
    const group = groupedToggle.value ? ROUTES[i % ROUTES.length] : undefined

    built.push({ timestamp, value: costFor(), ...(group ? { group } : {}) })

    if (Math.random() < 0.3) {
      built.push({ timestamp, value: costFor(), ...(group ? { group } : {}) })
    }
  }

  return built
})

// Sources return raw ids only; a consumer that knows the names hands them in.
const display: Display = { 'route-a': { name: 'Route A' }, 'route-b': { name: 'Route B' } }

const requestsData = computed<ScatterChartData>(() => ({
  points: points.value,
  metric: 'ai.cost',
  dimension: groupedToggle.value ? 'route' : undefined,
  display,
  start: start.toISOString(),
  end: end.toISOString(),
}))

const HOUR_MS = 60 * 60 * 1000
const MODELS: Record<string, number> = { 'gpt-4o': 0.011, 'claude-sonnet': 0.007, 'llama-3': 0.005 }

const exploreData = computed<ExploreResultV4>(() => {
  const models = groupedToggle.value ? Object.keys(MODELS) : ['gpt-4o']
  const buckets = emptyState.value ? 0 : (end.valueOf() - start.valueOf()) / HOUR_MS

  const data = Array.from({ length: buckets }, (_, hour) => models.map(model => {
    const requests = Math.round(Math.random() * 480)
    const cost = requests * MODELS[model] * (0.7 + Math.random() * 0.5)

    return {
      timestamp: new Date(start.valueOf() + hour * HOUR_MS).toISOString(),
      event: {
        ai_request_count: requests,
        cost: Math.round(cost * 1e4) / 1e4,
        ...(groupedToggle.value ? { ai_gateway_model: model } : {}),
      },
    }
  })).flat()

  return {
    data,
    meta: {
      start: start.toISOString(),
      end: end.toISOString(),
      granularity_ms: HOUR_MS,
      display: groupedToggle.value ? { ai_gateway_model: Object.fromEntries(models.map(model => [model, { name: model }])) } : {},
      metric_names: ['ai_request_count', 'cost'],
      metric_units: { ai_request_count: 'count', cost: 'usd' },
      query_id: '',
    } as unknown as QueryResponseMeta,
  }
})

const analyticsChartOptions = computed<AnalyticsChartOptions>(() => ({
  type: 'scatter',
  metricAxesTitle: 'Cost',
  chartDatasetColors: [pointColor.value],
  scatter: {
    percentileLines: percentileLinesToggle.value
      ? [{ percentile: 50 }, { percentile: outlierPercentile.value }]
      : undefined,
    outlierPercentile: outlierToggle.value ? outlierPercentile.value : undefined,
    shadeOutlierRegion: shadeToggle.value,
    jitterMs: jitterMinutes.value * 60 * 1000,
    pointRadius: 2,
    pointOpacity: pointOpacity.value,
  },
}))

const optionsCode = computed(() => JSON.stringify(analyticsChartOptions.value, null, 2))
</script>

<style lang="scss" scoped>
@use "../styles/charts-sandbox";
</style>
