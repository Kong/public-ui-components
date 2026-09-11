<template>
  <SandboxLayout
    :links="appLinks"
    title="Heatmap"
  >
    <HeatmapChart
      :data="data"
      series-name="Token usage"
      :x-axis-labels="months"
      :y-axis-labels="weekdays"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { HeatmapChart } from '../../src'
import type { HeatmapDataPoint } from '../../src'
import { appLinks } from '../navigation'

// GitHub contribution-style grid: 52 weekly columns on the x-axis, labeled by
// month at each month boundary, weekdays on the y-axis
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weeks = 52

const start = new Date(new Date().getFullYear(), 0, 1)
const months: string[] = []
let lastMonth = -1

const data: HeatmapDataPoint[] = []
for (let w = 0; w < weeks; w++) {
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + w * 7)
  months.push(weekStart.getMonth() !== lastMonth ? weekStart.toLocaleString('en-US', { month: 'short' }) : '')
  lastMonth = weekStart.getMonth()
  for (let d = 0; d < 7; d++) {
    data.push([w, d, Math.floor(Math.random() * 100)])
  }
}
</script>
