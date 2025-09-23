<template>
  <div class="container">
    <div
      v-if="!hasData"
      class="no-data"
      data-testId="sparkline-empty"
    >
      <slot name="empty">
        {{ i18n.t('sparkline_no_data') }}
      </slot>
    </div>
    <Bar
      v-else-if="type === 'sparkline_bar'"
      :chart-id="chartId"
      :data="chartData"
      data-testId="sparkline-bar"
      :options="(options as any)"
      :plugins="plugins"
    />
    <Line
      v-else-if="type === 'sparkline_line' || type === 'sparkline_step'"
      :chart-id="chartId"
      :data="chartData"
      :data-testId="type === 'sparkline_line' ? 'sparkline-line' : 'sparkline-step'"
      :options="(options as any)"
      :plugins="plugins"
    />
    <ToolTip
      v-if="!disableTooltip"
      :absolute-left="tooltipLeft"
      :absolute-top="tooltipTop"
      class="tooltip"
      data-testid="sparkline-tooltip"
      :state="tooltipData"
      :tooltip-title="tooltipTitle"
      @dimensions="onTooltipDimensions"
    />

    <div
      v-if="hasData && showLabel"
      class="label"
      :title="$slots.label ? '' : formattedLabel"
    >
      <slot
        name="label"
        :total="total"
        :total-by-dataset="totalByDataset"
      >
        {{ formattedLabel }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { format } from 'date-fns'
import 'chartjs-adapter-date-fns'
import { type ChartOptions, Tooltip } from 'chart.js'
import { formatTime } from '@kong-ui-public/analytics-utilities'

import composables from '../composables'
import { lineChartTooltipBehavior } from '../utils'
import bucketTimestamps from '../utils/bucketTimestamps'
import type { ExternalTooltipContext, SparklineDataset, SparklineType, TooltipState } from '../types'
import { VerticalLinePlugin } from './chart-plugins/VerticalLinePlugin'
import ToolTip from './chart-plugins/ChartTooltip.vue'

const {
  datasets,
  disableTooltip = false,
  maxCount,
  maxStamp = Date.now(),
  minStamp,
  pointRenderCount = 24,
  showLabel = false,
  tooltipTitle,
  type = 'sparkline_bar',
} = defineProps<{
  datasets: SparklineDataset[]
  disableTooltip?: boolean
  /**
   * determines the relative sizes/heights of bars/points after bucketing
   */
  maxCount: number
  /**
   * determines the relative position of bars/points, defaults to Date.now()
   */
  maxStamp?: number
  /**
   * determines the relative position of bars/points.
   */
  minStamp: number
  /**
   * The number of datapoints to render. Will bucket timestamps into ranges that
   * are `(maxStamp - minStamp) / pointRenderCount` apart. `pointRenderCount`
   * must be greater than 1 (will default to 2 if a value less than 2 is
   * provided) as you can't draw a line without at least 2 points rendered.
   */
  pointRenderCount?: number
  showLabel?: boolean
  tooltipTitle?: string
  type: SparklineType
}>()

const chartId = crypto.randomUUID()
const { i18n } = composables.useI18n()
const tooltipData = reactive<TooltipState>({
  showTooltip: false,
  tooltipContext: 0, // Set in lineChartTooltipBehavior
  metricDisplay: '',
  tooltipSeries: [],
  left: '',
  top: '',
  units: 'count',
  translateUnit: () => '',
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: type === 'sparkline_bar' ? 'timeseries_bar' : 'timeseries_line',
  chartID: chartId,
  interactionMode: 'idle',
})

const onTooltipDimensions = ({ width, height }: { width: number, height: number }) => {
  tooltipData.width = width
  tooltipData.height = height
}

const plugins = computed(() => disableTooltip ? [] : [new VerticalLinePlugin()])

const emit = defineEmits<{
  (e: 'max', max: number): void
}>()

const groupSizeMs = computed<number>(() => {
  const count = Math.max(2, pointRenderCount)
  const range = Math.abs(maxStamp - minStamp)
  return Math.ceil(range / count)
})

const totalByDataset = computed<Record<string, number>>(() => {
  return datasets.reduce((acc, { timestamps, label }) => ({
    ...acc,
    [label]: timestamps.length,
  }), {})
})

const formattedLabel = computed<string>(() => {
  return datasets
    .map(({ label }): [number, string] => [
      totalByDataset.value[label],
      `${label}: ${totalByDataset.value[label]}`,
    ])
    .sort(([a], [b]) => b - a)
    .map(([, enrichedLabel]) => enrichedLabel)
    .join(', ')
})

const total = computed<number>(() => {
  return Object.keys(totalByDataset.value)
    .map((key) => totalByDataset.value[key])
    .reduce((total, datasetTotal) => total + datasetTotal, 0)
})

const hasData = computed<boolean>(() => {
  return total.value > 0
})

const isStacked = computed<boolean>(() => datasets.length > 1)

const chartDatasets = computed<Array<{
  label: string
  data: Array<{ x: number, y: number }>
  backgroundColor?: string
  fill?: boolean
}>>(() => datasets.map(({ timestamps, color, label }) => {
  const buckets = bucketTimestamps({
    groupSizeMs: groupSizeMs.value,
    minStamp,
    maxStamp,
    timestamps,
  })

  const data = buckets.map(([timestamp, count]) => ({
    x: timestamp,
    y: count,
  }))

  return {
    data,
    label,
    ...((type === 'sparkline_bar' || isStacked.value) && color && { backgroundColor: color }),
    ...(type !== 'sparkline_bar' && color && { borderColor: color }),
    ...(isStacked.value && type !== 'sparkline_bar' && { fill: true }),
  }
}))

const chartData = computed(() => ({
  labels: new Array(pointRenderCount).fill(''),
  datasets: chartDatasets.value,
}))

const positionKey = `SparklineTooltipPosition-${chartId}`
const options = computed<ChartOptions>(() => ({
  maintainAspectRatio: false,
  elements: {
    categoryPercentage: 1,
    barPercentage: 1,
    line: {
      tension: 0,
      stepped: type === 'sparkline_step',
      borderWidth: 1,
    },
    point: {
      radius: 0,
      pointHitRadius: 11,
      pointHoverRadius: 0,
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  layout: {
    padding: 0,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
      position: positionKey,
      external: (context: ExternalTooltipContext) => {
        lineChartTooltipBehavior(tooltipData, context, 'minutely', {
          contextFormatter: (x: number) => {
            const rangeEnd = x + groupSizeMs.value

            let end: string | number = ''
            if (groupSizeMs.value > 24 * 60 * 60 * 1000) {
              // more than a day
              end = format(new Date(rangeEnd), 'MMM dd, yyy hh:mm a')
            } else {
              end = format(new Date(rangeEnd), 'hh:mm a')
            }

            return `${formatTime(x)} - ${end}`
          },
        })
      },
    },
  },
  scales: {
    x: {
      max: maxStamp,
      min: minStamp - 1, // this allows a value exactly equal to minStamp to be drawn without clipping
      type: 'timeseries',
      offset: false,
      grid: {
        display: false,
      },
      display: false,
      stacked: isStacked.value,
    },
    y: {
      min: 0,
      ...(maxCount !== undefined && { max: maxCount }),
      grid: {
        display: false,
      },
      display: false,
      stacked: isStacked.value,
    },
  },
}))

const tooltipTop = ref('0')
const tooltipLeft = ref('0')

onMounted(() => {
  Tooltip.positioners[positionKey] = function(elements, position) {
    if (!elements.length || tooltipData.interactionMode === 'interactive') {
      return false
    }

    const offset = 10
    const chartRect = this.chart.canvas.getBoundingClientRect()
    const tooltipWidth = tooltipData.width || this.width
    const tooltipHeight = tooltipData.height || this.height

    const fitsAbove = (chartRect.top - tooltipHeight) > 0

    const y = fitsAbove
      ? chartRect.top - tooltipHeight - offset
      : chartRect.top + chartRect.height + offset

    const fitsLeft = chartRect.left > (tooltipWidth / 2) - position.x
    const maxLeft = Math.max(offset, window.innerWidth - offset - tooltipWidth)
    const x = Math.min(maxLeft, fitsLeft
      ? Math.floor(chartRect.left - (tooltipWidth / 2)) + position.x
      : 0 + offset)

    tooltipTop.value = `${y}px`
    tooltipLeft.value = `${x}px`

    return {
      x,
      y,
      xAlign: 'center',
      yAlign: fitsAbove ? 'top' : 'bottom',
    }
  }
})

onUnmounted(() => {
  if (Tooltip.positioners[positionKey]) {
    delete Tooltip.positioners[positionKey]
  }
})

watch(chartDatasets, () => {
  let max = 0
  for (let i = 0; i < (pointRenderCount + 1); i++) {
    let pointTotal = 0
    for (let j = 0; j < chartDatasets.value.length; j++) {
      pointTotal += chartDatasets.value[j].data[i]?.y ?? 0
    }

    max = Math.max(max, pointTotal)
  }
  emit('max', max)
}, { immediate: true })
</script>

<style lang="scss" scoped>
.container {
  align-items: center;
  border: 1px solid $kui-color-border-neutral-weaker;
  border-radius: $kui-border-radius-20;
  display: flex;
  height: 30px;
  justify-content: center;
  overflow: hidden;
  padding-top: 1px;
  position: relative;

  .no-data {
    color: $kui-color-text-neutral;
    cursor: default;
    font-size: $kui-font-size-20;
    user-select: none;
  }

  .label {
    background-color: $kui-method-color-background-patch;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: $kui-border-radius-20;
    border-right: 1px solid $kui-color-border-neutral-weaker;
    border-top-left-radius: $kui-border-radius-20;
    border-top-right-radius: 0;
    color: $kui-color-text-primary;
    cursor: default;
    font-size: 10px;
    left: 0;
    line-height: 9px;
    max-width: 90%;
    overflow: hidden;
    padding: 2px 6px 2px 6px;
    position: absolute;
    text-overflow: ellipsis;
    top: 0;
    user-select: none;
    white-space: nowrap;
  }

  .tooltip {
    z-index: 10;
  }
}
</style>
