<template>
  <SandboxLayout
    :links="appLinks"
    title="Heatmap"
  >
    <section class="example">
      <h2>Contribution grid (default)</h2>
      <HeatmapChart
        :data="yearData"
        :option="sparseLabelsOption"
        series-name="Token usage"
        :x-axis-labels="weekLabels"
        :y-axis-labels="weekdays"
      />
    </section>

    <section class="example">
      <h2>Custom color range</h2>
      <HeatmapChart
        :color-range="['#fef3c7', '#b45309']"
        :data="data"
        :x-axis-labels="months"
        :y-axis-labels="workdays"
      />
    </section>

    <section class="example">
      <h2>Option override (cell labels + tighter grid)</h2>
      <HeatmapChart
        :data="data"
        :option="optionOverride"
        :x-axis-labels="months"
        :y-axis-labels="workdays"
      />
    </section>

    <section class="example">
      <h2>Height override</h2>
      <HeatmapChart
        :data="data"
        height="200px"
        :x-axis-labels="months"
        :y-axis-labels="workdays"
      />
    </section>

    <section class="example">
      <h2>Value formatter</h2>
      <HeatmapChart
        :data="data"
        series-name="Requests"
        :value-formatter="(value) => `${value} req/s`"
        :x-axis-labels="months"
        :y-axis-labels="workdays"
      />
    </section>

    <section class="example">
      <h2>Category-name data (no indexes)</h2>
      <HeatmapChart
        :data="namedData"
        :x-axis-labels="months"
        :y-axis-labels="workdays"
      />
    </section>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { HeatmapChart } from '../../src'
import type { EChartsOption, HeatmapDataPoint } from '../../src'
import { appLinks } from '../navigation'

const random = () => Math.floor(Math.random() * 100)

// GitHub contribution-style grid: 52 weekly columns on the x-axis, labeled by
// month at each month boundary, weekdays on the y-axis
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weeks = 52

const start = new Date(new Date().getFullYear(), 0, 1)
const weekLabels: string[] = []
let lastMonth = -1

const yearData: HeatmapDataPoint[] = []
for (let w = 0; w < weeks; w++) {
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + w * 7)
  weekLabels.push(weekStart.getMonth() !== lastMonth ? weekStart.toLocaleString('en-US', { month: 'short' }) : '')
  lastMonth = weekStart.getMonth()
  for (let d = 0; d < 7; d++) {
    yearData.push([w, d, random()])
  }
}

// `weekLabels` is sparse (most entries are ''), so show every label instead of
// ECharts' default 'auto' interval, which would otherwise hide some of them
const sparseLabelsOption: EChartsOption = {
  xAxis: { axisLabel: { interval: 0 } },
}

// Smaller grid for the remaining examples
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
const workdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const data: HeatmapDataPoint[] = months.flatMap((_, x) =>
  workdays.map((__, y) => [x, y, random()]),
)

const namedData: HeatmapDataPoint[] = months.flatMap((month) =>
  workdays.map((day) => [month, day, random()]),
)

const optionOverride: EChartsOption = {
  grid: { top: 30, bottom: 80 },
  // Merged by index into the generated series, so its data is kept
  series: [{ label: { show: true } }],
}
</script>

<style lang="scss" scoped>
.example {
  margin-bottom: var(--kui-space-70, 32px);

  h2 {
    margin-bottom: var(--kui-space-40, 16px);
  }
}
</style>
