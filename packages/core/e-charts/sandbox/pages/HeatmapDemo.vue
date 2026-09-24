<template>
  <SandboxLayout
    :links="appLinks"
    title="Heatmap"
  >
    <section class="example">
      <h2>Contribution grid</h2>
      <HeatmapChart
        :data="yearData"
        :option="sparseLabelsOption"
        series-name="Token usage"
        :x-axis-labels="weekLabels"
        :y-axis-labels="weekdays"
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
</script>

<style lang="scss" scoped>
.example {
  margin-bottom: var(--kui-space-70, 32px);

  h2 {
    margin-bottom: var(--kui-space-40, 16px);
  }
}
</style>
