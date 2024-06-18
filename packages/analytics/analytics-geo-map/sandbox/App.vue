<template>
  <div class="sandbox-container">
    <KLabel> Fit to country: </KLabel>
    <KInput v-model="fitToCountry" />
    <KMultiselect
      v-model="selectedCountries"
      :items="items"
      label="Pick Something"
    />
    <div class="map-container">
      <AnalyticsGeoMap
        :country-metrics="countryMetrics"
        :fit-to-country="fitToCountry"
        :geo-json-data="(countryGeoJson as FeatureCollection)"
        :initial-zoom="1.6"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnalyticsGeoMap } from '../src'
import countryGeoJson from './countries.geo.json'
import type { FeatureCollection } from 'geojson'

const fitToCountry = ref('')
const selectedCountries = ref<string[]>([])

const items = ref([
  { label: 'US', value: 'US' },
  { label: 'BR', value: 'BR' },
  { label: 'RU', value: 'RU' },
  { label: 'CN', value: 'CN' },
  { label: 'IN', value: 'IN' },
  { label: 'ZA', value: 'ZA' },
  { label: 'RO', value: 'RO' },
  { label: 'DE', value: 'DE' },
  { label: 'FR', value: 'FR' },
])

const countryMetrics = computed(() => {
  const metrics: Record<string, number> = {}
  selectedCountries.value.forEach((country) => {
    metrics[country] = Math.floor(Math.random() * 100)
  })
  return metrics

})

</script>

<style lang="scss" scoped>
  .sandbox-container {
    height: 900px;

    .map-container {
      height: 500px;
      width: 700px;
    }
  }
</style>
