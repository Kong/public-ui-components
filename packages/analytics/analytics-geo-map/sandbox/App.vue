<template>
  <div class="sandbox-container">
    <KLabel> Fit to country: </KLabel>
    <KInput
      v-model="fitToCountry"
    />
    <KMultiselect
      v-model="selectedCountries"
      :items="items"
      label="Pick Something"
    />
    <AnalyticsGeoMap
      :country-metrics="countryMetrics"
      :fit-to-country="fitToCountry"
      :initial-zoom="1.6"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnalyticsGeoMap } from '../src'

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

// const countryMetrics = ref<Record<string, number>>({
//   US: 4,
//   BR: 20,
//   RU: 40,
//   CN: 99,
//   IN: 69,
//   ZA: 63,
//   RO: 50,
//   DE: 30,
//   FR: 10,
// })

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
  }
</style>
