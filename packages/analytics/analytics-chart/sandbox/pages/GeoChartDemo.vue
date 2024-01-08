<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
  >
    <template #controls />

    <GeoChart
      :chart-data="chartData"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">

import { inject, onMounted, ref } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { GeoChart, type KChartData } from '../../src'
import { topojson, type Feature } from 'chartjs-chart-geo'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])
const chartData = ref<KChartData>()

onMounted(async () => {
  const data = await fetch('https://unpkg.com/world-atlas/countries-50m.json').then((r) => r.json())
  let countries = topojson.feature(data, data.objects.countries).features
  countries = countries.filter(c => c.properties.name !== 'Antarctica')

  chartData.value = {
    labels: countries.map((c: Feature) => c.properties.name),
    datasets: [{
      label: 'Countries',
      data: countries.map((c: Feature) => ({
        feature: c,
        value: Math.random() * 100,
      })),
    }],
  }
})

</script>
