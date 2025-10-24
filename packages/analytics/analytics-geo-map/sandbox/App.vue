<template>
  <div class="sandbox-container">
    <KCard>
      <div class="card-content">
        <div class="map-container">
          <AnalyticsGeoMap
            :bounds="bounds"
            :country-metrics="countryMetrics"
            :fit-to-country="fitToCountry"
            :metric="selectedMetric"
            :metric-unit="metricUnit"
            @bounds-change="console.log('bounds changed', $event)"
          />
        </div>
        <div class="controls">
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
          </div>

          <div class="row">
            <KSelect
              v-model="(selectedMetric as any)"
              :items="[
                { label: 'Request Count', value: 'request_count' },
                { label: 'Response Size Average', value: 'response_size_average' },
                { label: 'Response Latency Average', value: 'response_latency_average' },
                { label: 'Requests per minute', value: 'request_per_minute' },
              ]"
              label="Select Metric"
            />
          </div>

          <div class="row">
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
          </div>
        </div>
      </div>
    </KCard>

    <KCard>
      <div class="card-content">
        <div class="map-container">
          <AnalyticsGeoMap
            :country-metrics="importedCountryMetrics"
            :metric="'request_count'"
            :metric-unit="'count'"
            :with-legend="true"
          />
        </div>
        <div class="controls">
          <h3>Imported explore result</h3>
          <CodeText
            v-model="exploreResultText"
          />
        </div>
      </div>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MetricUnits } from '../src'
import { AnalyticsGeoMap, exploreResultToCountryMetrics } from '../src'
import CodeText from './CodeText.vue'
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'

function isValidJson(str: string): boolean {
  if (!str) return true

  try {
    JSON.parse(str)
  } catch {
    return false
  }

  return true
}


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
const exploreResultText = ref('')
const isValid = computed(() => exploreResultText.value !== undefined &&
  exploreResultText.value !== '' &&
  isValidJson(exploreResultText.value))
const selectedMetric = ref<ExploreAggregations>('request_count')
const selectedCountries = ref<string[]>(items.value.map(i => i.value))
const bounds = ref<Array<[number, number]>>([
  [-180, -90],
  [180, 90],
])
const metricUnit = computed<MetricUnits>(() => {
  const map: Partial<Record<ExploreAggregations, MetricUnits>> = {
    request_count: 'count',
    response_size_average: 'bytes',
    response_latency_average: 'ms',
    request_per_minute: 'count/minute',
  }

  return map[selectedMetric.value as ExploreAggregations] || 'count'
})
const countryMetrics = computed(() => {
  const metrics: Record<string, number> = {}
  selectedCountries.value.forEach((country) => {
    metrics[country] = Math.floor(Math.random() * 1000000)
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

const importedCountryMetrics = computed(() => {
  if (!isValid.value) return {}

  return exploreResultToCountryMetrics(JSON.parse(exploreResultText.value || '{}'))
})

</script>

<style lang="scss" scoped>
.sandbox-container {
  .card-content {
    display: flex;
    gap: 50px;

    .map-container {
      flex: 2;
    }

    .controls {
      flex: 1;
    }
  }

  .row {
    display: flex;
    gap: 2em;
    margin-top: 1em;

    .select-countries {
      width: 50%;
    }
  }

  .map-container {
    height: 700px;
    margin-top: 1em;
    width: 900px;
  }
}
</style>
