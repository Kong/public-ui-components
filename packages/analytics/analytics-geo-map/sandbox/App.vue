<template>
  <div class="sandbox-container">
    <div class="row">
      <div>
        <KLabel for="fit">
          Fit to country
        </KLabel>
        <KInput
          id="fit"
          v-model="fitToCountry"
          help="Enter a country code to fit the map to that country"
          placeholder="e.g. US, DE, JP"
        />
      </div>

      <div class="select-countries">
        <KMultiselect
          v-model="selectedCountries"
          :items="items"
          label="Filter by country"
        />
      </div>
    </div>

    <div class="row">
      <KButton
        size="medium"
        @click="genNewBounds()"
      >
        Generate new bounds
      </KButton>
      <KButton
        appearance="secondary"
        size="medium"
        @click="genNewBounds(true)"
      >
        Reset bounds
      </KButton>
      <KInputSwitch
        v-model="truncateMetrics"
        label="Truncate metrics"
      />
    </div>


    <div class="map-container">
      <AnalyticsGeoMap
        :bounds="bounds"
        :country-metrics="countryMetrics"
        :fit-to-country="fitToCountry"
        :metric="'request_count'"
        :metric-unit="'requests'"
        :truncated-metric="truncateMetrics"
        @bounds-change="console.log('bounds changed', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnalyticsGeoMap } from '../src'

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
const fitToCountry = ref()
const selectedCountries = ref<string[]>(items.value.map(i => i.value))
const bounds = ref<Array<[number, number]>>([
  [-180, -90],
  [180, 90],
])
const truncateMetrics = ref(true)

const countryMetrics = computed(() => {
  const metrics: Record<string, number> = {}
  selectedCountries.value.forEach((country) => {
    metrics[country] = Math.floor(Math.random() * 50000)
  })
  return metrics
})

const genNewBounds = (reset = false) => {
  if (reset) {
    bounds.value = [
      [-180, -90],
      [180, 90],
    ]

    return
  }

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

  .row {
    margin-top: 1em;
    display: flex;
    gap: 2em;

    .select-countries {
      width: 50%;
    }
  }

  .map-container {
    margin-top: 1em;
    height: 700px;
    width: 900px;
  }
}
</style>
