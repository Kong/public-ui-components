<template>
  <div class="wrapper">
    <HeatmapChart
      v-if="metric && data?.meta?.start && data?.meta?.end"
      :data="heatmapData"
      height="100%"
      :series-name="seriesName"
      :tooltip-title="options.chart_title ?? undefined"
      :value-formatter="valueFormatter"
      :x-axis-labels="days"
      :y-axis-labels="dimensionValues"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../composables'
import { HeatmapChart } from '@kong-ui-public/e-charts'
import type { HeatmapDataPoint } from '@kong-ui-public/e-charts'
import type { ExploreResultV4, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import '@kong-ui-public/e-charts/dist/style.css'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { format } from 'date-fns'


const { i18n } = composables.useI18n()
const { formatUnit } = unitFormatter({ i18n })


const {
  data,
  query,
  options,
} = defineProps<{
  data: ExploreResultV4
  query: ValidDashboardChartQuery
  options: any
}>()

const metric = computed<string>(() => {
  if (query?.metrics?.[0]) {
    return query.metrics[0]
  }

  return ''
})

const seriesName = computed(() => {
  // @ts-ignore dynamic lookup
  return i18n.te(`chartLabels.${metric.value}`) // @ts-ignore dynamic lookup
    ? i18n.t(`chartLabels.${metric.value}`)
    : metric.value
})

const unit = computed<string>(() => {
  if (metric.value === 'cost') {
    return 'usd'
  }
  if (metric.value.includes('latency')) {
    return 'ms'
  }
  return ''
})

const valueFormatter = (value: any) => {
  return formatUnit(value, unit.value)
}

const getXAxis = (start: Date, end: Date) => {
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
  data.data.forEach((datapoint: any) => {
    uniqueVals.add(datapoint.event[dimName])
  })
  return Array.from(uniqueVals).map((uniqueVal) => data.meta.display[dimName][uniqueVal].name)
})

const heatmapData = computed<HeatmapDataPoint[]>(() => {
  if (!data.data) {
    return []
  }

  const dimName = query.dimensions[0] === 'time'
    ? query.dimensions[1]
    : query.dimensions[0]

  const metricName = metric.value

  return data.data.map((datapoint: any) => {
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

