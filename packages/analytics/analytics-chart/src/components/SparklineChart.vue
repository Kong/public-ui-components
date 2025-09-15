<template>
  <div class="container">
    <slot
      v-if="!hasData"
      name="empty"
    >
      <div
        class="no-data"
        data-testId="sparkline-empty"
      >
        {{ i18n.t('sparkline_no_data') }}
      </div>
    </slot>
    <Bar
      v-else-if="type === 'bar'"
      :data="chartData"
      data-testId="sparkline-bar"
      :options="(options as any)"
    />
    <Line
      v-else-if="type === 'line' || type === 'step'"
      :data="chartData"
      :data-testId="type === 'line' ? 'sparkline-line' : 'sparkline-step'"
      :options="(options as any)"
    />

    <div
      v-if="hasData && showLabel"
      class="label"
    >
      <slot
        name="label"
        :total="total"
        :total-by-dataset="totalByDataset"
      >
        {{ total }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import 'chartjs-adapter-date-fns'
import { Bar, Line } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'
import composables from '../composables'
import bucketTimestamps from '../utils/bucketTimestamps'
import type { SparklineDataset } from '../types'

const { i18n } = composables.useI18n()

const {
  showLabel = false,
  maxCount,
  maxStamp = Date.now(),
  minStamp,
  pointRenderCount = 24,
  datasets,
  type = 'bar',
} = defineProps<{
  showLabel?: boolean
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
  datasets: SparklineDataset[]
  type: 'bar' | 'line' | 'step'
}>()

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
    ...((type === 'bar' || isStacked.value) && color && { backgroundColor: color }),
    ...(type !== 'bar' && color && { borderColor: color }),
    ...(isStacked.value && type !== 'bar' && { fill: true }),
  }
}))

const chartData = computed(() => ({
  labels: new Array(pointRenderCount).fill(''),
  datasets: chartDatasets.value,
}))

const options = computed<ChartOptions>(() => ({
  maintainAspectRatio: false,
  elements: {
    categoryPercentage: 1,
    barPercentage: 1,
    line: {
      tension: 0,
      stepped: type === 'step',
      borderWidth: 1,
    },
    point: {
      radius: 0,
    },
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
    padding: 2px 6px 2px 6px;
    position: absolute;
    top: 0;
    user-select: none;
  }
}
</style>
