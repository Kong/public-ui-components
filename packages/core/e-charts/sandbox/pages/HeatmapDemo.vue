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
      <h2>Model by error rate</h2>
      <HeatmapChart
        :color-range="errorRateColors"
        :data="errorRates"
        series-name="Error rate"
        show-values
        tooltip-title="Last 7 days"
        :value-formatter="(value) => `${value.toFixed(1)}%`"
        :visible-rows="10"
        :x-axis-labels="days"
        :y-axis-labels="models"
      />
      <p>Rows are sorted by error rate, highest first. The tooltip shows a title set with `tooltip-title`.</p>
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
      <h2>Option and seriesOption overrides (square cells + tighter grid)</h2>
      <HeatmapChart
        :data="data"
        :option="optionOverride"
        :series-option="seriesOverride"
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
import type { EChartsOption, HeatmapDataPoint, HeatmapSeriesOption } from '../../src'
import { appLinks } from '../navigation'

const random = () => Math.floor(Math.random() * 100)

// Models (rows) by day (columns), sorted by average error rate, highest first.
// More models than `visibleRows`, so the rest scroll.
const days = ['Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21', 'Jun 22']
const unsortedModels = [
  'gpt-5.6-terra', 'nvidia/NVIDIA-Nemotron-70B', 'cohere/command-a', 'thinkingmachines/tinker',
  'gpt-4o', 'llama-3.3-70b', 'openai/gpt-oss-20b', 'gpt-4o-mini', 'claude-sonnet-4',
  'deepseek-ai/DeepSeek-V4-Instruct-Preview', 'mistral-large', 'qwen-3-72b', 'gemma-3-27b', 'phi-4',
]
const rates = new Map(unsortedModels.map((model) => [model, days.map(() => Math.round(Math.random() * 400) / 10)]))
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const models = [...unsortedModels].sort((a, b) => average(rates.get(b)!) - average(rates.get(a)!))
const errorRates: HeatmapDataPoint[] = models.flatMap((model) =>
  rates.get(model)!.map((rate, day): HeatmapDataPoint => [days[day], model, rate]),
)

// Low (good) to high (bad)
const errorRateColors = ['#dde4ec', '#f0dcc9', '#a3302f']

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
}

// Merged into the generated series, so its data and other styles are kept
const seriesOverride: HeatmapSeriesOption = {
  itemStyle: { borderRadius: 0, borderWidth: 4 },
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
