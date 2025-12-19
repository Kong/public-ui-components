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
      :plugins="plugins as Plugin<'bar'>[]"
    />
    <Line
      v-else-if="type === 'sparkline_line' || type === 'sparkline_step'"
      :chart-id="chartId"
      :data="chartData"
      :data-testId="type === 'sparkline_line' ? 'sparkline-line' : 'sparkline-step'"
      :options="(options as any)"
      :plugins="plugins as Plugin<'line'>[]"
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
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { format } from 'date-fns'
import 'chartjs-adapter-date-fns'
import { type ChartOptions, type Plugin, Tooltip } from 'chart.js'
import { formatTime } from '@kong-ui-public/analytics-utilities'

import composables from '../composables'
import { lineChartTooltipBehavior } from '../utils'
import type { ExternalTooltipContext, SparklineDataset, SparklineType, TooltipState } from '../types'
import { VerticalLinePlugin } from './chart-plugins/VerticalLinePlugin'
import ToolTip from './chart-plugins/ChartTooltip.vue'

const {
  chartKey = undefined, // highly recommended
  datasets, // the only required prop
  disableTooltip = false,
  enableBrushing = false,
  groupKey = undefined, // highly recommended
  maxCount = undefined,
  maxStamp = undefined,
  minCount = undefined,
  minStamp = undefined,
  pointRenderCount = 24,
  showLabel = false,
  tooltipTitle = undefined,
  type = 'sparkline_bar',
} = defineProps<{
  /**
   * WARNING `chartKey` without `groupKey` does nothing.
   * WARNING `chartKey` must be static across renders.
   *
   * Each sparkline that is a part of a group must provide a unique identifier
   * that is consistent across renders. This allows all sparklines in that group
   * to share state. See `groupKey` for details.
   */
  chartKey?: string
  /**
   * A collection of timestamps. Given the number of `pointRenderCount` and the
   * range of timestamps to be drawn, the timestamps will be bucketed with a
   * count of how many timestamps are in each bucket. For example, given
   * timestamps `[1, 1, 1, 4, 5, 6]` and a `pointRenderCount` of 2, will render
   * two data points: 1-3: 3, 4-6: 3. However, if your `pointRenderCount` was 3
   * it would instead render three data points: 1-2: 3, 3-4: 1, 5-6: 2
   */
  datasets: SparklineDataset[]
  disableTooltip?: boolean
  /**
   * WARNING `enableBrushing` without `groupKey` and `chartKey` does nothing.
   *
   * When brushing is enabled a vertical line will be drawn at the mouse
   * position on all sparklines that share the same `groupKey`.
   */
  enableBrushing?: boolean
  /**
   * WARNING `groupKey` without `chartKey` does nothing.
   * WARNING `groupKey` must be static across renders.
   *
   * Every sparkline that has the same `groupKey` will be forced to render all
   * data at the same scale in both the X and Y axes. Each one will effectively
   * inherit the smallest `minStamp`, largest `maxStamp`, and largest `maxCount`.
   * For each sparkline that doesn't have those props, it will calculate those
   * props from the dataset it's given and that dataset will be used to
   * influence other sparklines with this `groupKey` as well.
   */
  groupKey?: string
  /**
   * determines the relative sizes/heights of bars/points on the y axis after
   * bucketing the timestamps in your datasets. Defaults to the largest count.
   * If lower than the largest count the data will be truncated.
   */
  maxCount?: number
  /**
   * determines the relative position of bars/points on the x axis, defaults to
   * the largest timestamp in your datasets. If set lower than the largest
   * timestamp, the data will be truncated.
   */
  maxStamp?: number
  /**
   * determines the relative sizes/heights of bars/points on the y axis after
   * bucketing the timestamps in your datasets. Defaults to 0. If higher than
   * the lowest count the data will be truncated.
   */
  minCount?: number
  /**
   * determines the relative position of bars/points on the x axis, defaults to
   * the smallest timestamp in your datasets. If set higher than the smallest
   * timestamp, the data will be truncated
   */
  minStamp?: number
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

const {
  syncedGroupSizeMs,
  syncedMinStamp,
  syncedMaxStamp,
  syncedMinCount,
  syncedMaxCount,
  syncedRenderPoints,
  syncedChartDatasets,
} = composables.useSparklineSync({
  chartKey,
  datasets,
  groupKey,
  minStamp,
  maxStamp,
  minCount,
  maxCount,
  renderPoints: pointRenderCount,
  type,
})

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

const plugins = computed(() => disableTooltip ? [] : [new VerticalLinePlugin({
  // if either groupKey or chartKey is undefined then brushing doesn't make any
  // sense as the data in this chart isn't related to any other data.
  enableBrushing: groupKey !== undefined && chartKey !== undefined && enableBrushing,
  brushStrategy: 'group',
  brushGroup: groupKey,
})])

const totalByDataset = computed<Record<string, number>>(() => {
  return syncedChartDatasets.value.reduce((acc, { data, label }) => ({
    ...acc,
    [label]: data.reduce((total, { y }) => total + y, 0),
  }), {})
})

const formattedLabel = computed<string>(() => {
  return syncedChartDatasets.value
    .map(({ label }): [number, string] => [
      totalByDataset.value[label] ?? 0,
      `${label}: ${totalByDataset.value[label]}`,
    ])
    .sort(([a], [b]) => b - a)
    .map(([, enrichedLabel]) => enrichedLabel)
    .join(', ')
})

const total = computed<number>(():number => {
  return Object.keys(totalByDataset.value)
    .map((key) => totalByDataset.value[key])
    .filter((v) => v !== undefined)
    .reduce((total, datasetTotal) => total + datasetTotal, 0)
})

const hasData = computed<boolean>(() => {
  return total.value > 0
})

const chartData = computed(() => ({
  labels: new Array(syncedRenderPoints.value).fill(''),
  datasets: syncedChartDatasets.value,
}))

const isStacked = computed<boolean>(() => datasets.length > 1)
const positionKey = `SparklineTooltipPosition-${chartId}`
const options = computed<ChartOptions>(() => {
  const isBar = type === 'sparkline_bar'

  const xMin = isBar
    ? syncedMinStamp.value - 1 // offset to handle the half-width of bar centering
    : syncedMinStamp.value

  const xMax = isBar
    ? syncedMaxStamp.value
    : syncedMaxStamp.value - syncedGroupSizeMs.value // non-bar charts graph from the left edge of the bucket, so the last datapoint is syncedGroupSizeMs away from the edge of the graph

  return {
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
      padding: {
        left: isBar ? 0 : 2,
        right: isBar ? 0 : 2,
        top: 2,
      },
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
              const rangeEnd = x + syncedGroupSizeMs.value

              let end: string | number = ''
              if (syncedGroupSizeMs.value > 24 * 60 * 60 * 1000) {
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
        min: xMin,
        max: xMax,
        type: 'timeseries',
        offset: false,
        grid: {
          display: false,
        },
        display: false,
        stacked: isStacked.value,
      },
      y: {
        min: Math.max(syncedMinCount.value - 1, 0),
        max: syncedMaxCount.value,
        grid: {
          display: false,
        },
        display: false,
        stacked: isStacked.value,
      },
    },
  }
})

const tooltipTop = ref('0')
const tooltipLeft = ref('0')

onMounted(() => {
  Tooltip.positioners[positionKey] = function(elements, position) {
    if (!elements.length || tooltipData.interactionMode === 'interactive' || position.x === null) {
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
