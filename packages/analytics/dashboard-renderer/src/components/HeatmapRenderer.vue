<template>
  <div class="wrapper">
    <HeatmapChart
      v-if="data?.meta?.start && data?.meta?.end"
      :data="heatmapData"
      series-name="Token usage"
      :x-axis-labels="days"
      :y-axis-labels="dimensionValues"
      :tooltip-formatter="tooltipFormatter"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HeatmapChart } from '@kong-ui-public/e-charts'
import type { HeatmapDataPoint, HeatmapTooltipFormatter } from '@kong-ui-public/e-charts'
import type { ExploreResultV4, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import { format } from 'date-fns'

const {
  data,
  query,
} = defineProps<{
  data: ExploreResultV4
  query: ValidDashboardChartQuery
}>()

const getXAxis = (start: Date, end: Date) => {
  console.log(start, end)
  const dates = []
  const current = new Date(start)

  while (current < end) {
    dates.push(format(new Date(current), 'MMM dd'))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

const days = computed(() => {
  if (data?.meta?.start && data?.meta?.end) {
    return getXAxis(new Date(data.meta.start as string), new Date(data.meta.end as string))
  }
  return []
})

const dimensionValues = computed(() => {
  if (!query.dimensions || query.dimensions.length !== 2 || !data?.meta?.display) {
    return []
  }

  const dimName = query.dimensions[0] === 'time'
    ? query.dimensions[1]
    : query.dimensions[0]

  const uniqueVals = new Set()
  data.data.forEach((datapoint) => {
    uniqueVals.add(datapoint.event[dimName])
  })
  return Array.from(uniqueVals).map((uniqueVal) => data.meta.display[dimName][uniqueVal].name).sort((a, b) => b.localeCompare(a))
})

const tooltipFormatter: HeatmapTooltipFormatter = (params) => {
  const { marker, seriesName, value } = Array.isArray(params) ? params[0] : params
  const [xIndex, yIndex, metricValue] = value as HeatmapDataPoint

	return `${marker}${dimensionValues.value[yIndex]}<br/>${days.value[xIndex]}: ${metricValue}`
}

const heatmapData: HeatmapDataPoint[] = computed(() => {
  if (!data.data) {
    return []
  }

  const dimName = query.dimensions[0] === 'time'
    ? query.dimensions[1]
    : query.dimensions[0]

  const metricName = query.metrics[0]

  return data.data.map((datapoint) => {
    const day = format(new Date(datapoint.timestamp), 'MMM dd')
    const dim = data.meta.display[dimName][datapoint.event[dimName]].name
    return [days.value.indexOf(day), dimensionValues.value.indexOf(dim), Number.parseFloat(datapoint.event[metricName])]
  })
})
</script>

<style lang="scss" scoped>
.wrapper {
  height: 100%;

  > * {
    height: 100%;
  }
}
</style>

