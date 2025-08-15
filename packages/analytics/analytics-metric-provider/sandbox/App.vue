<template>
  <div>
    <select v-model="timeframeSelection">
      <option value="">
        None
      </option>
      <option value="15m">
        15 minutes
      </option>
      <option value="6h">
        6 hours
      </option>
      <option value="24h">
        1 day
      </option>
    </select>
  </div>
  <h4>Global props, Large cards</h4>
  <div>
    <SandboxBridgeInjector :query-bridge="globalBridge">
      <MetricsProvider v-bind="globalProviderProps">
        <MetricsConsumer
          :card-size="MetricCardSize.Large"
        />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>

  <h4>Global props, Small cards</h4>
  <div style="width: 330px">
    <SandboxBridgeInjector :query-bridge="globalBridge">
      <MetricsProvider v-bind="globalProviderProps">
        <MetricsConsumer
          :card-size="MetricCardSize.Small"
        />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>

  <h4>Filtered props, Medium cards</h4>
  <div v-if="!USE_REAL_DATA">
    <SandboxBridgeInjector :query-bridge="globalBridge">
      <MetricsProvider v-bind="filteredProviderProps">
        <MetricsConsumer
          :card-size="MetricCardSize.Medium"
        />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>
  <div>
    <SandboxBridgeInjector :query-bridge="singleProviderBridge">
      <MetricsProvider v-bind="singleProviderProps">
        <MetricsConsumer :card-size="MetricCardSize.Medium" />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>

  <h4>Multiple Entities, Large cards</h4>
  <div>
    <SandboxBridgeInjector :query-bridge="multiProviderBridge">
      <MetricsProvider v-bind="multiProviderProps">
        <div id="route-blah">
          <MetricsConsumer lookup-key="blah😀😀" />
        </div>
        <div id="route-arrgh">
          <MetricsConsumer lookup-key="arrgh" />
        </div>
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>

  <h4>Table View</h4>
  <div>
    <SandboxBridgeInjector :query-bridge="timeframeProviderBridge">
      <MetricsProvider
        v-slot="{ timeframe }"
        v-bind="timeframeProviderProps"
      >
        <div>
          <button
            type="button"
            @click="randomizeData"
          >
            Randomize Data
          </button>
        </div>
        <div>Provider timeframe text: {{ timeframe.display }}</div>
        <table style="width: 50%">
          <tr>
            <th>Name</th>
            <th>Traffic</th>
            <th>Errors</th>
            <th>Latency</th>
          </tr>
          <tr>
            <td>Blah</td>
            <td>
              <MetricsConsumer
                v-slot="{ cardValues }"
                lookup-key="blah😀😀"
              >
                {{ cardValues.trafficCard.currentValue }}
              </MetricsConsumer>
            </td>
            <td>
              <MetricsConsumer
                v-slot="{ cardValues }"
                lookup-key="blah😀😀"
              >
                {{ cardValues.errorRateFormatted }}
              </MetricsConsumer>
            </td>
            <td>
              <MetricsConsumer
                v-slot="{ cardValues }"
                lookup-key="blah😀😀"
              >
                {{ cardValues.latencyCard.currentValue }}
              </MetricsConsumer>
            </td>
          </tr>
        </table>
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import MetricsConsumer from '../src/components/MetricsConsumer.vue'
import MetricsProvider from '../src/components/MetricsProvider.vue'
import type { MockOptions } from '../src/mockExploreResponse'
import { mockExploreResponse } from '../src/mockExploreResponse'
import axios from 'axios'
import type {
  AnalyticsBridge,
  DatasourceAwareQuery,
  ExploreFilter,
  ExploreQuery,
} from '@kong-ui-public/analytics-utilities'
import { TimePeriods } from '@kong-ui-public/analytics-utilities'
import { MetricCardSize } from '../src/enums'
import SandboxBridgeInjector from './SandboxBridgeInjector.vue'

const refreshInterval = 60 * 1000

// Need to have a local proxy running forwarding traffic to konnect api to hit real data.
const USE_REAL_DATA = false

const timeframeSelection = ref('15m')

const makeQueryBridge = (opts?: MockOptions): AnalyticsBridge => {

  const options = {
    method: 'POST',
    url: 'https://localhost:8443/konnect-explore-proxy',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {},
  }

  return {
    queryFn: (query: DatasourceAwareQuery) => {

      if (USE_REAL_DATA) {
        options.data = query
        return axios.request(options).then(res => res.data)
      } else {
        return Promise.resolve(mockExploreResponse(query.query as ExploreQuery, opts))
      }
    },

    configFn: () => {
      return Promise.resolve({
        analytics: {
          percentiles: true,
          retention_ms: 2592000000, // 30d
        },
        requests: {
          retention_ms: 86400000,
        },
      })
    },

    evaluateFeatureFlagFn: () => true as any,
  }
}

const overrideTimeframe = computed(() => {
  if (timeframeSelection.value) {
    return TimePeriods.get(timeframeSelection.value)
  }

  return undefined
})

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = computed(() => ({
  refreshInterval,
  overrideTimeframe: overrideTimeframe.value,
  longCardTitles: false,
  description: 'Generic Description',
}))

const globalBridge = makeQueryBridge()

// Query stats for an entire org, but also apply a filter.
const filteredProviderProps = computed(() => ({
  refreshInterval,
  overrideTimeframe: overrideTimeframe.value,
  additionalFilter: [{
    dimension: 'application',
    type: 'in',
    values: ['app1'],
  } as ExploreFilter],
  containerTitle: 'Analytics',
}))

// Query stats for a single entity, no grouping.
const singleProviderProps = computed(() => ({
  refreshInterval,
  overrideTimeframe: overrideTimeframe.value,
  dimension: 'route',
  filterValue: 'blah',
}))
const singleProviderBridge = makeQueryBridge({ dimensionNames: ['blah'] })

// Query stats for multiple entities.
const multiProviderProps = computed(() => ({
  refreshInterval,
  dimension: 'route',
  overrideTimeframe: overrideTimeframe.value,
}))
const multiProviderBridge = makeQueryBridge({ dimensionNames: ['blah😀😀', 'arrgh'] })

// Query stats with adjustable timeframe
const filterCounter = ref(0)

const randomizeData = () => {
  filterCounter.value += 1
}

const timeframeProviderProps = computed(() => ({
  refreshInterval,
  dimension: 'route',
  overrideTimeframe: overrideTimeframe.value,
  additionalFilter: [{ dimension: 'control_plane', operator: '=', value: '' + filterCounter.value }],
}))

const timeframeProviderBridge = makeQueryBridge({ dimensionNames: ['blah😀😀', 'arrgh'], deterministic: false })
</script>
<style lang="scss">
body {
  padding: 0 20px;

  h4 {
    color: #bbb;
    margin-top: 30px;
  }

  .metricscard {
    margin: 10px 0;
  }
}
</style>
