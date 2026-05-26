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
              v-model="mockDataType"
              :items="mockDataTypeItems"
              label="Mock data"
            />
            <div
              v-if="mockDataType === 'random'"
              class="button-row"
            >
              <KButton
                appearance="secondary"
                :disabled="!isGeneratedMockData"
                @click="regenerateRandomData"
              >
                Regenerate random data
              </KButton>
            </div>
            <p class="helper-text">
              {{
                isGeneratedMockData
                  ? 'Generated data is active. Import chart data below to override it.'
                  : 'Imported chart data is active. Clear the import field to use generated mock data.'
              }}
            </p>
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
                { label: 'Konnect', value: 'konnect' },
                { label: 'Custom', value: 'custom' },
              ]"
              label="Theme"
            />
          </div>

          <div
            v-if="activeThemeJson"
            class="control-group"
          >
            <KLabel>{{ theme === 'custom' ? 'Custom theme' : 'Konnect theme' }}</KLabel>
            <div
              v-if="theme === 'custom'"
              class="theme-color-grid"
            >
              <label
                v-for="control in customThemeColorControls"
                :key="control.key"
                class="color-control"
              >
                <span>{{ control.label }}</span>
                <input
                  v-model="customThemeColors[control.key]"
                  type="color"
                >
              </label>
              <KButton
                appearance="tertiary"
                @click="resetCustomTheme"
              >
                Reset colors
              </KButton>
            </div>
            <KTextArea
              :model-value="JSON.stringify(activeThemeJson, null, 2)"
              readonly
              :rows="12"
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
              v-if="isTimeseries"
              v-model="zoomEnabled"
              label="Zoom enabled"
            />
            <KInputSwitch
              v-if="isTimeseries"
              v-model="thresholdEnabled"
              label="Threshold"
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
            <KLabel>Mock data volume</KLabel>
            <div class="button-row">
              <KButton
                appearance="secondary"
                :disabled="!canAddDimensionsToActiveMockData"
                @click="addMoreDimensions"
              >
                Add 10 series
              </KButton>
              <KButton
                appearance="tertiary"
                :disabled="!canAddDimensionsToActiveMockData || extraDimensionCount === 0"
                @click="resetExtraDimensions"
              >
                Reset
              </KButton>
            </div>
            <p class="helper-text">
              {{
                canAddDimensionsToActiveMockData
                  ? `Adds ${extraDimensionCount} synthetic series to the selected generated mock data.`
                  : 'Available for generated single-dimension, status-code, and random mock data.'
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
  type AnalyticsExploreRecord,
  type ExploreAggregations,
  type ExploreResultV4,
  type QueryResponseMeta,
} from '@kong-ui-public/analytics-utilities'
import { useElementSize } from '@vueuse/core'
import { computed, provide, reactive, ref, useTemplateRef, watch } from 'vue'
import { ANALYTICS_ECHARTS_THEME_KEY, CrossSectionChart, TimeseriesChart } from '../src'
import useCrossSectionalChartData from '../src/composables/useCrossSectionalChartData'
import {
  createAnalyticsEchartsTheme,
  konnectTheme,
  konnectThemePalette,
  registerAnalyticsEchartsTheme,
} from '../src/themes'
import type {
  ChartLegendItem,
  ChartTooltipSortFn,
  LegendPosition,
  Threshold,
  TooltipEntry,
} from '../src'
import {
  canAddMockDimensions,
  generateSandboxMockData,
  type SandboxMockDataType,
} from '../src/sandbox/mock-data'
import { resolveChartScrollWindow, shouldHideAnnotationsForBreakpoint } from '../src/utils'
import CodeText from './CodeText.vue'

type SupportedChartTypes =
  | 'horizontal_bar'
  | 'vertical_bar'
  | 'timeseries_line'
  | 'timeseries_bar'
  | 'donut'

type SandboxTheme = 'light' | 'dark' | 'konnect' | 'custom'

const chartTypeItems = [
  { label: 'Timeseries line', value: 'timeseries_line' },
  { label: 'Timeseries bar', value: 'timeseries_bar' },
  { label: 'Vertical bar', value: 'vertical_bar' },
  { label: 'Horizontal bar', value: 'horizontal_bar' },
  { label: 'Donut', value: 'donut' },
]
const mockDataTypeItems: Array<{ label: string, value: SandboxMockDataType }> = [
  { label: 'Single dimension', value: 'single_dimension' },
  { label: 'Status codes', value: 'status_codes' },
  { label: 'Status code groups', value: 'status_code_groups' },
  { label: 'Multi metric', value: 'multi_metric' },
  { label: 'Random', value: 'random' },
]

const chartType = ref<SupportedChartTypes>('timeseries_line')
const exploreResultText = ref('')
const theme = ref<SandboxTheme>('light')
const renderMode = ref<'svg' | 'canvas'>('svg')
const mockDataType = ref<SandboxMockDataType>('random')
const randomDataVersion = ref(1)
const EXTRA_DIMENSION_BATCH_SIZE = 10
const timeseriesStacked = ref(false)
const crossSectionStacked = ref(true)
const showAnnotations = ref(true)
const showLegendValues = ref(true)
const hideLegend = ref(false)
const hideTruncationWarning = ref(false)
const chartHasData = ref(true)
const markAsTruncated = ref(false)
const useCustomTitles = ref(false)
const zoomEnabled = ref(true)
const thresholdEnabled = ref(false)
const thresholdValue = ref(500)
const tooltipTitleInput = ref('Analytics chart')
const metricAxisTitleInput = ref('Requests')
const dimensionAxisTitleInput = ref('Time buckets')
const emptyStateTitleInput = ref('No analytics data')
const emptyStateDescriptionInput = ref('Traffic will appear here once requests are available.')
const eventLog = ref('')
const legendPosition = ref<LegendPosition>('bottom')
const extraDimensionCount = ref(0)
const chartFrameRef = useTemplateRef('chartFrame')
const { width: chartFrameWidth, height: chartFrameHeight } = useElementSize(chartFrameRef)

const defaultCustomThemeColors = {
  seriesPrimary: konnectThemePalette[0],
  seriesSecondary: konnectThemePalette[1],
  seriesAccent: konnectThemePalette[2],
  background: '#ffffff',
  text: '#000933',
  axis: '#6c7489',
  grid: '#e0e4ea',
}
type CustomThemeColorKey = keyof typeof defaultCustomThemeColors

const customThemeColors = reactive({ ...defaultCustomThemeColors })
const customThemeVersion = ref(0)
const customThemeColorControls: Array<{ key: CustomThemeColorKey, label: string }> = [
  { key: 'seriesPrimary', label: 'Series 1' },
  { key: 'seriesSecondary', label: 'Series 2' },
  { key: 'seriesAccent', label: 'Series 3' },
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'axis', label: 'Axis' },
  { key: 'grid', label: 'Grid line' },
]

const customTheme = computed(() => createAnalyticsEchartsTheme({
  axisColor: customThemeColors.axis,
  backgroundColor: customThemeColors.background,
  color: [
    customThemeColors.seriesPrimary,
    customThemeColors.seriesSecondary,
    customThemeColors.seriesAccent,
  ],
  gridLineColor: customThemeColors.grid,
  textColor: customThemeColors.text,
}))
const customThemeName = computed(() => `sandbox-custom-${customThemeVersion.value}`)
const activeThemeName = computed(() => theme.value === 'custom' ? customThemeName.value : theme.value)
const activeThemeJson = computed(() => {
  if (theme.value === 'konnect') {
    return konnectTheme
  }

  if (theme.value === 'custom') {
    return customTheme.value
  }

  return null
})

provide(ANALYTICS_ECHARTS_THEME_KEY, activeThemeName)

watch(customTheme, (nextTheme) => {
  customThemeVersion.value += 1
  registerAnalyticsEchartsTheme(customThemeName.value, nextTheme)
}, { immediate: true })

const resetCustomTheme = () => {
  Object.assign(customThemeColors, defaultCustomThemeColors)
}

const chartLegendSortFn = (a: ChartLegendItem, b: ChartLegendItem) => {
  return (b.value?.raw || 0) - (a.value?.raw || 0)
}

const chartTooltipSortFn: ChartTooltipSortFn = (a: TooltipEntry, b: TooltipEntry) => {
  return b.rawValue - a.rawValue
}

const addMoreDimensions = () => {
  extraDimensionCount.value += EXTRA_DIMENSION_BATCH_SIZE
}

const resetExtraDimensions = () => {
  extraDimensionCount.value = 0
}

const regenerateRandomData = () => {
  randomDataVersion.value += 1
}

const isGeneratedMockData = computed(() => !exploreResultText.value.trim())
const canAddDimensionsToActiveMockData = computed(() => {
  return isGeneratedMockData.value && canAddMockDimensions(mockDataType.value)
})

watch(mockDataType, (nextMockDataType) => {
  resetExtraDimensions()

  if (nextMockDataType === 'random') {
    regenerateRandomData()
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

  return generateSandboxMockData({
    chartKind: 'timeseries',
    extraDimensionCount: extraDimensionCount.value,
    mockDataType: mockDataType.value,
    randomSeed: randomDataVersion.value,
  })
})

const baseCrossSectionData = computed<ExploreResultV4>(() => {
  if (parsedExploreResult.value) {
    return parsedExploreResult.value
  }

  return generateSandboxMockData({
    chartKind: 'cross_section',
    extraDimensionCount: extraDimensionCount.value,
    mockDataType: mockDataType.value,
    randomSeed: randomDataVersion.value,
  })
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
    mockDataType: parsedExploreResult.value ? 'imported' : mockDataType.value,
    extraGeneratedSeries: parsedExploreResult.value ? undefined : extraDimensionCount.value,
    stacked: stacked.value,
    renderMode: renderMode.value,
    theme: activeThemeName.value,
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

.theme-color-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.color-control {
  align-items: center;
  color: var(--kui-color-text, #000933);
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;
  line-height: 1.4;
}

.color-control input {
  background: transparent;
  border: 0;
  height: 28px;
  padding: 0;
  width: 44px;
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
  .theme-color-grid,
  .toggles-grid {
    grid-template-columns: 1fr;
  }

  .chart-frame {
    height: 360px;
  }
}
</style>
