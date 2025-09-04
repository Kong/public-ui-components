<template>
  <div class="sandbox-container">
    <KLabel> Fit to country: </KLabel>
    <KInput v-model="fitToCountry" />
    <KMultiselect
      v-model="selectedCountries"
      :items="items"
      label="Pick Something"
    />
    <KButton @click="genNewBounds()">
      Generate new bounds
    </KButton>
    <div class="map-container">
      <AnalyticsGeoMap
        :bounds="bounds"
        :country-metrics="countryMetrics"
        :fit-to-country="fitToCountry"
        :metric="'request_count'"
        :metric-unit="'requests'"
        @bounds-change="console.log('bounds changed', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnalyticsGeoMap } from '../src'

const fitToCountry = ref()
const selectedCountries = ref<string[]>([])
const bounds = ref<Array<[number, number]>>([
  [-180, -90],
  [180, 90],
])

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
  { label: 'CA', value: 'CA' },
  { label: 'ES', value: 'ES' },
  { label: 'JP', value: 'JP' },
  { label: 'SG', value: 'SG' },
  { label: 'MY', value: 'MY' },
])

const countryMetrics = computed(() => {
  const metrics: Record<string, number> = {}
  selectedCountries.value.forEach((country) => {
    metrics[country] = Math.floor(Math.random() * 50000)
  })
  return metrics

})

const genNewBounds = () => {
  const sw: [number, number] = [
    Math.random() * -180,
    Math.random() * -90,
  ]
  const ne: [number, number] = [
    Math.random() * 180,
    Math.random() * 90,
  ]


  bounds.value = [sw, ne]
}

</script>

<style lang="scss" scoped>
  .sandbox-container {
    height: 900px;

    .map-container {
      height: 700px;
      width: 900px;
    }
  }
</style>
