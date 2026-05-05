<template>
  <div class="sandbox-container">
    <main class="sandbox-grid">
      <KCard class="preview-card">
        <div class="card-header">
          <h2>analytics-echarts sandbox</h2>
          <p>Use this to compare in-scope behavior with analytics-chart and experiment with ECharts-specific UX.</p>
        </div>

        <div
          ref="chartFrame"
          class="chart-frame"
        >
          <TimeseriesChart
            v-if="isTimeseries"
            :chart-legend-sort-fn="chartLegendSortFn"
            :chart-tooltip-sort-fn="chartTooltipSortFn"
            :color-palette="chartColorPalette"
            :data="timeseriesData"
            :dimension-axes-title="dimensionAxisTitle"
            :empty-state-description="emptyStateDescription"
            :empty-state-title="emptyStateTitle"
            :explore-link="{ href: '#' }"
            :hide-truncation-warning="hideTruncationWarning"
            :legend-position="effectiveLegendPosition"
            :metric-axes-title="metricAxisTitle"
            :render-mode="renderMode"
            :requests-link="{ href: '#' }"
            :show-legend-values="showLegendValues"
            :stacked="stacked"
            :theme="theme"
            :threshold="chartThreshold"
            :timeseries-zoom="zoomEnabled"
            :tooltip-title="tooltipTitle"
            :type="chartType"
            @select-chart-range="eventLog += 'Select chart range ' + JSON.stringify($event) + '\n'"
            @zoom-time-range="eventLog += 'Zoomed to ' + JSON.stringify($event) + '\n'"
          />
          <CrossSectionChart
            v-else
            :chart-legend-sort-fn="chartLegendSortFn"
            :chart-tooltip-sort-fn="chartTooltipSortFn"
            :color-palette="chartColorPalette"
            :data="crossSectionalData"
            :dimension-axes-title="dimensionAxisTitle"
            :empty-state-description="emptyStateDescription"
            :empty-state-title="emptyStateTitle"
            :hide-truncation-warning="hideTruncationWarning"
            :legend-position="effectiveLegendPosition"
            :metric-axes-title="metricAxisTitle"
            :render-mode="renderMode"
            :show-annotations="showAnnotations"
            :show-legend-values="showLegendValues"
            :stacked="stacked"
            :theme="theme"
            :tooltip-title="tooltipTitle"
            :type="chartType"
          />
        </div>

        <KLabel>Event Log</KLabel>
        <KTextArea
          id="event-log-codeblock"
          :model-value="eventLog || '// Interactions will be logged here'"
          readonly
          :rows="8"
        />
      </KCard>

      <KCard class="controls-card">
        <div class="controls-stack">
          <div class="control-group">
            <KSelect
              v-model="chartType"
              :items="chartTypeItems"
              label="Chart type"
            />
          </div>

          <div class="control-group">
            <KSelect
              v-model="renderMode"
              :items="[
                { label: 'SVG', value: 'svg' },
                { label: 'Canvas', value: 'canvas' },
              ]"
              label="Render mode"
            />
          </div>

          <div class="control-group">
            <KSelect
              v-model="theme"
              :items="[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]"
              label="Theme"
            />
          </div>

          <div class="control-group toggles-grid">
            <KInputSwitch
              v-model="stacked"
              :label="stacked ? 'Stacked' : 'Unstacked'"
            />
            <KInputSwitch
              v-model="showLegendValues"
              label="Show legend values"
            />
            <KInputSwitch
              v-if="isCrossSectionBar"
              v-model="showAnnotations"
              :label="showAnnotations ? 'Show annotations' : 'Hide annotations'"
            />
            <KInputSwitch
              v-model="hideLegend"
              label="Hide legend"
            />
            <KInputSwitch
              v-model="hideTruncationWarning"
              label="Hide truncation warning"
            />
            <KInputSwitch
              v-model="chartHasData"
              label="Chart has data"
            />
            <KInputSwitch
              v-model="markAsTruncated"
              label="Truncated result"
            />
            <KInputSwitch
              v-model="useCustomTitles"
              label="Custom axis titles"
            />
            <KInputSwitch
              v-model="useCustomPalette"
              label="Custom palette"
            />
            <KInputSwitch
              v-if="isTimeseries"
              v-model="zoomEnabled"
              label="Zoom enabled"
            />
            <KInputSwitch
              v-if="isTimeseries"
              v-model="thresholdEnabled"
              label="Threshold"
            />
            <KInputSwitch
              v-model="isMultiDimension"
              :label="isMultiDimension ? 'Multi-dimension' : 'Single dimension'"
            />
            <KInputSwitch
              v-model="isMultiMetric"
              :label="isMultiMetric ? 'Multi-metric' : 'Single metric'"
            />
          </div>

          <div
            v-if="thresholdEnabled && isTimeseries"
            class="control-group"
          >
            <KInput
              v-model="thresholdValue"
              label="Threshold value"
              type="number"
            />
          </div>

          <div
            v-if="useCustomTitles"
            class="control-group titles-grid"
          >
            <KInput
              v-model="tooltipTitleInput"
              label="Tooltip title"
            />
            <KInput
              v-model="metricAxisTitleInput"
              label="Metric axis title"
            />
            <KInput
              v-model="dimensionAxisTitleInput"
              label="Dimension axis title"
            />
            <KInput
              v-model="emptyStateTitleInput"
              label="Empty state title"
            />
            <KInput
              v-model="emptyStateDescriptionInput"
              label="Empty state description"
            />
          </div>

          <div class="control-group">
            <KSelect
              v-model="legendPosition"
              :items="[
                { label: 'Bottom', value: 'bottom' },
                { label: 'Hidden', value: 'hidden' },
              ]"
              label="Legend position"
            />
          </div>

          <div class="control-group">
            <KLabel>Mock dimensions</KLabel>
            <div class="button-row">
              <KButton
                appearance="secondary"
                :disabled="!isGeneratedMockData"
                @click="addMoreDimensions"
              >
                Add 10 dimensions
              </KButton>
              <KButton
                appearance="tertiary"
                :disabled="!isGeneratedMockData || extraDimensionCount === 0"
                @click="resetExtraDimensions"
              >
                Reset
              </KButton>
            </div>
            <p class="helper-text">
              {{
                isGeneratedMockData
                  ? `Adds ${extraDimensionCount} synthetic dimensions to generated sandbox data.`
                  : 'Available only when using generated sandbox data.'
              }}
            </p>
          </div>

          <div
            v-if="isCrossSectionBar"
            class="control-group"
          >
            <KLabel>Annotations</KLabel>
            <p class="helper-text">
              {{ annotationStatusMessage }}
            </p>
          </div>

          <div class="control-group">
            <KLabel>Import chart data</KLabel>
            <CodeText v-model="exploreResultText" />
          </div>

          <div class="control-group">
            <KLabel>Effective data</KLabel>
            <KTextArea
              :model-value="JSON.stringify(activeData, null, 2)"
              readonly
              :rows="12"
            />
          </div>

          <div class="control-group">
            <KLabel>Effective props</KLabel>
            <KTextArea
              :model-value="JSON.stringify(activeChartProps, null, 2)"
              readonly
              :rows="8"
            />
          </div>
        </div>
      </KCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  generateCrossSectionalData,
  generateMultipleMetricTimeSeriesData,
  generateSingleMetricTimeSeriesData,
  type AnalyticsExploreRecord,
  type ExploreAggregations,
  type ExploreResultV4,
  type QueryResponseMeta,
} from '@kong-ui-public/analytics-utilities'
import { useElementSize } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { CrossSectionChart, TimeseriesChart } from '../src'
import useCrossSectionalChartData from '../src/composables/useCrossSectionalChartData'
import type {
  AnalyticsChartColors,
  ChartLegendItem,
  ChartTooltipSortFn,
  LegendPosition,
  Threshold,
  TooltipEntry,
} from '../src'
import { resolveChartScrollWindow, shouldHideAnnotationsForBreakpoint } from '../src/utils'
import CodeText from './CodeText.vue'

type SupportedChartTypes =
  | 'horizontal_bar'
  | 'vertical_bar'
  | 'timeseries_line'
  | 'timeseries_bar'
  | 'donut'

const chartTypeItems = [
  { label: 'Timeseries line', value: 'timeseries_line' },
  { label: 'Timeseries bar', value: 'timeseries_bar' },
  { label: 'Vertical bar', value: 'vertical_bar' },
  { label: 'Horizontal bar', value: 'horizontal_bar' },
  { label: 'Donut', value: 'donut' },
]

const chartType = ref<SupportedChartTypes>('timeseries_line')
const exploreResultText = ref('')
const theme = ref<'light' | 'dark'>('light')
const renderMode = ref<'svg' | 'canvas'>('svg')
const EXTRA_DIMENSION_BATCH_SIZE = 10
const BASE_STATUS_CODE_DIMENSIONS = ['200', '300', '400', '500', 'empty'] as const
const BASE_ROUTE_DIMENSIONS = ['payments', 'search', 'billing'] as const
const timeseriesStacked = ref(false)
const crossSectionStacked = ref(true)
const showAnnotations = ref(true)
const showLegendValues = ref(true)
const hideLegend = ref(false)
const hideTruncationWarning = ref(false)
const chartHasData = ref(true)
const markAsTruncated = ref(false)
const useCustomTitles = ref(false)
const useCustomPalette = ref(false)
const zoomEnabled = ref(true)
const thresholdEnabled = ref(false)
const thresholdValue = ref(500)
const tooltipTitleInput = ref('Analytics chart')
const metricAxisTitleInput = ref('Requests')
const dimensionAxisTitleInput = ref('Time buckets')
const emptyStateTitleInput = ref('No analytics data')
const emptyStateDescriptionInput = ref('Traffic will appear here once requests are available.')
const eventLog = ref('')
const isMultiDimension = ref(false)
const isMultiMetric = ref(false)
const legendPosition = ref<LegendPosition>('bottom')
const extraDimensionCount = ref(0)
const chartFrameRef = useTemplateRef('chartFrame')
const { width: chartFrameWidth, height: chartFrameHeight } = useElementSize(chartFrameRef)

const chartLegendSortFn = (a: ChartLegendItem, b: ChartLegendItem) => {
  return (b.value?.raw || 0) - (a.value?.raw || 0)
}

const chartTooltipSortFn: ChartTooltipSortFn = (a: TooltipEntry, b: TooltipEntry) => {
  return b.rawValue - a.rawValue
}

const customPalette: AnalyticsChartColors = {
  '200': '#91d9a2',
  '300': '#fde59d',
  '400': '#f7bf8a',
  '500': '#ef8f8f',
  empty: '#d7dbe2',
}

const buildSyntheticDimensions = ({ prefix, count }: { prefix: string, count: number }) => {
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`)
}

const addMoreDimensions = () => {
  extraDimensionCount.value += EXTRA_DIMENSION_BATCH_SIZE
}

const resetExtraDimensions = () => {
  extraDimensionCount.value = 0
}

const isGeneratedMockData = computed(() => !exploreResultText.value.trim())

const dimensions = computed(() => {
  const syntheticStatusCodes = buildSyntheticDimensions({ prefix: 'status', count: extraDimensionCount.value })
  const syntheticRoutes = buildSyntheticDimensions({ prefix: 'route', count: extraDimensionCount.value })

  return {
    status_code: [...BASE_STATUS_CODE_DIMENSIONS, ...syntheticStatusCodes],
    ...(isMultiDimension.value ? { route: [...BASE_ROUTE_DIMENSIONS, ...syntheticRoutes] } : {}),
  }
})

const chartThreshold = computed<Partial<Record<ExploreAggregations, Threshold[]>> | undefined>(() => {
  if (!thresholdEnabled.value) {
    return undefined
  }

  return {
    request_count: [{
      type: 'error',
      value: thresholdValue.value,
      highlightIntersections: true,
    }],
  }
})

const isTimeseries = computed(() => {
  return chartType.value === 'timeseries_line' || chartType.value === 'timeseries_bar'
})
const isCrossSectionBar = computed(() => {
  return chartType.value === 'horizontal_bar' || chartType.value === 'vertical_bar'
})
const stacked = computed({
  get: () => isTimeseries.value ? timeseriesStacked.value : crossSectionStacked.value,
  set: (value: boolean) => {
    if (isTimeseries.value) {
      timeseriesStacked.value = value

      return
    }

    crossSectionStacked.value = value
  },
})

const parsedExploreResult = computed<ExploreResultV4 | undefined>(() => {
  if (!exploreResultText.value.trim()) {
    return undefined
  }

  try {
    return JSON.parse(exploreResultText.value) as ExploreResultV4
  } catch {
    return { data: [] as AnalyticsExploreRecord[], meta: {} as QueryResponseMeta } as ExploreResultV4
  }
})

const baseTimeseriesData = computed<ExploreResultV4>(() => {
  if (parsedExploreResult.value) {
    return parsedExploreResult.value
  }

  return isMultiMetric.value
    ? generateMultipleMetricTimeSeriesData([
      { name: 'request_count', unit: 'count' },
      { name: 'response_latency_average', unit: 'ms' },
    ])
    : generateSingleMetricTimeSeriesData(
      { name: 'request_count', unit: 'count' },
      dimensions.value,
    )
})

const baseCrossSectionData = computed<ExploreResultV4>(() => {
  if (parsedExploreResult.value) {
    return parsedExploreResult.value
  }

  return generateCrossSectionalData(
    isMultiMetric.value
      ? [
        { name: 'request_count', unit: 'count' },
        { name: 'response_latency_average', unit: 'ms' },
      ]
      : [{ name: 'request_count', unit: 'count' }],
    dimensions.value,
  )
})

const withSandboxMeta = (value: ExploreResultV4) => {
  return {
    ...value,
    data: chartHasData.value ? value.data : [],
    meta: {
      ...value.meta,
      truncated: markAsTruncated.value,
      limit: markAsTruncated.value ? 3 : value.meta.limit,
    },
  } satisfies ExploreResultV4
}

const timeseriesData = computed<ExploreResultV4>(() => withSandboxMeta(baseTimeseriesData.value))
const crossSectionalData = computed<ExploreResultV4>(() => withSandboxMeta(baseCrossSectionData.value))
const sandboxCrossSectionChartData = useCrossSectionalChartData({}, crossSectionalData)

const chartColorPalette = computed<AnalyticsChartColors | undefined>(() => {
  return useCustomPalette.value ? customPalette : undefined
})
const effectiveLegendPosition = computed<LegendPosition>(() => hideLegend.value ? 'hidden' : legendPosition.value)

const tooltipTitle = computed(() => useCustomTitles.value ? tooltipTitleInput.value : undefined)
const metricAxisTitle = computed(() => useCustomTitles.value ? metricAxisTitleInput.value : undefined)
const dimensionAxisTitle = computed(() => useCustomTitles.value ? dimensionAxisTitleInput.value : undefined)
const emptyStateTitle = computed(() => useCustomTitles.value ? emptyStateTitleInput.value : undefined)
const emptyStateDescription = computed(() => useCustomTitles.value ? emptyStateDescriptionInput.value : undefined)

const activeData = computed(() => isTimeseries.value ? timeseriesData.value : crossSectionalData.value)
const crossSectionAnnotationState = computed(() => {
  if (!isCrossSectionBar.value) {
    return null
  }

  const scrollWindow = resolveChartScrollWindow({
    axisSize: chartType.value === 'horizontal_bar' ? chartFrameHeight.value : chartFrameWidth.value,
    categoryCount: sandboxCrossSectionChartData.value.labels?.length || 0,
    scrollWindow: null,
  })
  const annotationsHiddenByBreakpoint = shouldHideAnnotationsForBreakpoint({
    chartWidth: chartFrameWidth.value,
    chartHeight: chartFrameHeight.value,
  })

  return {
    annotationsSuppressed: annotationsHiddenByBreakpoint || scrollWindow !== null,
    isScrollable: scrollWindow !== null,
  }
})
const annotationStatusMessage = computed(() => {
  if (!crossSectionAnnotationState.value) {
    return 'Annotations apply only to cross-sectional bar charts.'
  }

  if (!showAnnotations.value) {
    return 'Annotations are manually disabled.'
  }

  if (crossSectionAnnotationState.value.annotationsSuppressed) {
    if (crossSectionAnnotationState.value.isScrollable) {
      return 'Annotations are suppressed because the chart is scrollable at the current size.'
    }

    return 'Annotations are suppressed because the chart is below the current responsive size threshold.'
  }

  return 'Annotations are enabled.'
})
const activeChartProps = computed(() => {
  return {
    type: chartType.value,
    stacked: stacked.value,
    renderMode: renderMode.value,
    theme: theme.value,
    legendPosition: effectiveLegendPosition.value,
    showAnnotations: isCrossSectionBar.value ? showAnnotations.value : undefined,
    effectiveShowAnnotations: isCrossSectionBar.value
      ? showAnnotations.value && !crossSectionAnnotationState.value?.annotationsSuppressed
      : undefined,
    showLegendValues: showLegendValues.value,
    tooltipTitle: tooltipTitle.value,
    metricAxesTitle: metricAxisTitle.value,
    dimensionAxesTitle: dimensionAxisTitle.value,
    hideTruncationWarning: hideTruncationWarning.value,
    colorPalette: chartColorPalette.value,
    ...(isTimeseries.value ? {
      timeseriesZoom: zoomEnabled.value,
      threshold: chartThreshold.value,
    } : {}),
  }
})
</script>

<style scoped lang="scss">
.sandbox-container {
  padding: 16px;
}

.sandbox-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
}

.preview-card,
.controls-card {
  min-height: calc(100vh - 48px);
}

.card-header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 4px;
  }

  p {
    color: var(--kui-color-text-neutral, #6b7280);
    margin: 0;
  }
}

.chart-frame {
  height: 420px;
  margin-bottom: 16px;
}

.controls-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.helper-text {
  color: var(--kui-color-text-neutral, #6b7280);
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

.toggles-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.titles-grid {
  display: grid;
  gap: 12px;
}

@media (max-width: 1200px) {
  .sandbox-grid {
    grid-template-columns: 1fr;
  }

  .preview-card,
  .controls-card {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .toggles-grid {
    grid-template-columns: 1fr;
  }

  .chart-frame {
    height: 360px;
  }
}
</style>
