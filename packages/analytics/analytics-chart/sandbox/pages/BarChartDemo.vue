<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
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
                :selected-value="'horizontal_bar'"
              >
                Horizontal Bar
              </KRadio>
            </div>
            <div>
              <KRadio
                v-model="chartType"
                name="chartType"
                :selected-value="'vertical_bar'"
              >
                VerticalBar
              </KRadio>
            </div>
          </div>
          <br>
        </div>

        <!-- Legend position -->
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
        <br>
        <!-- Metric item selection -->
        <KSelect
          :items="metricItems"
          label="Metric"
          placeholder="Select Metric"
          @selected="onMetricSelected"
        />
        <br>
        <div>
          <KInputSwitch
            v-model="multiDimensionToggle"
            :label="multiDimensionToggle ? 'Multi Dimension' : 'Single Dimension'"
          />
        </div>
        <!-- Dimension item selection -->
        <KMultiselect
          v-if="multiDimensionToggle"
          v-model="dimensionSelection"
          :items="dimensionItems"
          label="Dimensions"
          placeholder="Select Dimension"
          width="100%"
        />
      </div>
      <br>

      <!-- Dataset options -->
      <KLabel>Dataset options</KLabel>
      <div class="dataset-options">
        <KButton
          appearance="secondary"
          size="small"
          @click="addDataset()"
        >
          Add dataset
        </KButton>
      </div>
      <br>

      <div class="option-toggles">
        <KLabel>Option toggles</KLabel>
        <div v-if="!multiDimensionToggle">
          <KInputSwitch
            v-model="multiMetricToggle"
            :label="multiMetricToggle ? 'Multi Metric' : 'Single Metric'"
          />
        </div>
        <div v-if="chartType.includes('Line')">
          <KInputSwitch
            v-model="fillToggle"
            :label="fillToggle ? 'Fill' : 'No Fill'"
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
            v-model="emptyState"
            :label="emptyState ? 'Empty State' : 'Chart Has Data'"
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
        <div class="config-container-row">
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

    <div class="chart-container">
      <!-- Determine if a full blown chart is to be displayed, or a simplified one -->
      <AnalyticsChart
        :chart-data="(exploreResult)"
        :chart-options="analyticsChartOptions"
        :legend-position="legendPosition"
        :show-annotations="showAnnotationsToggle"
        :show-legend-values="showLegendValuesToggle"
        tooltip-title="tooltip title"
      />
    </div>

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
  AnalyticsChart,
  type ChartType,
  ChartLegendPosition,
} from '../../src'
import type { AnalyticsExploreRecord, DimensionMap, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, AnalyticsChartOptions } from '../../src/types'
import { isValidJson, rand } from '../utils/utils'
import { lookupDatavisColor } from '../../src/utils'
import { lookupStatusCodeColor } from '../../src/utils/customColors'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { generateCrossSectionalData } from '@kong-ui-public/analytics-utilities'
import CodeText from '../CodeText.vue'

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

const multiMetricToggle = ref(false)
const fillToggle = ref(true)
const stackToggle = ref(true)
const limitToggle = ref(false)
const multiDimensionToggle = ref(false)
const showAnnotationsToggle = ref(true)
const showLegendValuesToggle = ref(true)
const emptyState = ref(false)
const dimensionSelection = ref(['status_code'])
const chartType = ref<ChartType>('horizontal_bar')
const legendPosition = ref(ChartLegendPosition.Bottom)
const selectedMetric = ref<MetricSelection>({
  name: Metrics.TotalRequests,
  unit: 'count',
})
const secondaryMetrics = ref([{ name: 'secondaryMetric', unit: 'count' }])

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

const dimensionItems = [{
  label: 'Status Code',
  value: 'status_code',
  selected: true,
}, {
  label: 'Service',
  value: 'service',
}]

// Short labels
const statusCodeLabels = [
  '500', '200', '300', '400', 'empty',
]

const statusCodeDimensionValues = ref(new Set(statusCodeLabels))

const serviceDimensionValues = ref(new Set([
  'service1', 'service2', 'service3', 'service4', 'service5',
]))

const exploreResultText = ref()
const hasError = computed(() => !isValidJson(exploreResultText.value))
const isValid = computed(() => exploreResultText.value !== undefined &&
  exploreResultText.value !== '' &&
  isValidJson(exploreResultText.value))

const exploreResult = computed<ExploreResultV4>(() => {
  if (emptyState.value) {
    return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta }
  }

  // If sample json was provided, attempt to render the chart
  if (exploreResultText.value) {

    try {
      const result = JSON.parse(exploreResultText.value)

      return result as ExploreResultV4
    } catch {
      return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta }
    }
  }

  // Else, generate sample data
  const dimensionMap: DimensionMap = dimensionSelection.value.reduce((obj, dimension) => {
    return {
      ...obj,
      [dimension]: [...(dimension === 'status_code' ? statusCodeDimensionValues.value : serviceDimensionValues.value)],
    }
  }, {})

  const metaOverrides: Partial<QueryResponseMeta> = {
    truncated: limitToggle.value,
    limit: limitToggle.value ? 10 : 50,
  }

  if (multiDimensionToggle.value) {
    return generateCrossSectionalData([{
      name: selectedMetric.value.name,
      unit: selectedMetric.value.unit,
    }], dimensionMap, metaOverrides)
  } else {
    return generateCrossSectionalData([{
      name: selectedMetric.value.name,
      unit: selectedMetric.value.unit,
    }, ...(multiMetricToggle.value ? secondaryMetrics.value : [])],
    dimensionMap, metaOverrides)
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
  // chartDatasetColors: colorPalette.value,
}))

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
  serviceDimensionValues.value = new Set(Array(1).fill(0).map(() => `Service${rand(1, 100)}`))
  statusCodeDimensionValues.value = new Set(statusCodeLabels)

  colorPalette.value = [...statusCodeDimensionValues.value].reduce((obj, dimension) => ({ ...obj, [dimension]: lookupStatusCodeColor(dimension) || lookupDatavisColor(rand(0, 5)) }), {})
})
</script>

<style lang="scss" scoped>
@use "../styles/charts-sandbox";

.chart-container {
  height: 500px;
  max-width: 70vw;

  @media(max-width: ($kui-breakpoint-laptop - 1px)) {
    max-width: 100vw;
  }
}

.data-container {
  margin-top: $kui-space-100;
}

</style>
