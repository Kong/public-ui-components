<template>
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
  <div>
    <SandboxBridgeInjector :query-bridge="globalBridge">
      <MetricsProvider v-bind="globalProviderProps">
        <MetricsConsumer
          :card-size="MetricCardSize.Small"
        />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>

  <h4>Filtered props, LargeCompact cards</h4>
  <div v-if="!USE_REAL_DATA">
    <SandboxBridgeInjector :query-bridge="globalBridge">
      <MetricsProvider v-bind="filteredProviderProps">
        <MetricsConsumer
          :card-size="MetricCardSize.LargeCompact"
        />
      </MetricsProvider>
    </SandboxBridgeInjector>
  </div>
  <div>
    <SandboxBridgeInjector :query-bridge="singleProviderBridge">
      <MetricsProvider v-bind="singleProviderProps">
        <MetricsConsumer :card-size="MetricCardSize.LargeCompact" />
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
</template>
<script setup lang="ts">
import MetricsConsumer from '../src/components/MetricsConsumer.vue'
import MetricsProvider from '../src/components/MetricsProvider.vue'
import type { MockOptions } from '../src/mockExploreResponse'
import { mockExploreResponse } from '../src/mockExploreResponse'
import axios from 'axios'
import type { AnalyticsBridge, ExploreFilter, ExploreQuery } from '@kong-ui-public/analytics-utilities'
import { TimeframeKeys, TimePeriods } from '@kong-ui-public/analytics-utilities'
import { MetricCardSize } from '@kong-ui-public/metric-cards'
import SandboxBridgeInjector from './SandboxBridgeInjector.vue'

const refreshInterval = 60 * 1000

// Need to have a local proxy running forwarding traffic to konnect api to hit real data.
const USE_REAL_DATA = false

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
    queryFn: (query: ExploreQuery) => {

      if (USE_REAL_DATA) {
        options.data = query
        return axios.request(options).then(res => res.data)
      } else {
        return Promise.resolve(mockExploreResponse(query, opts))
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

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = {
  refreshInterval,
  overrideTimeframe: TimePeriods.get(TimeframeKeys.SIX_HOUR),
  longCardTitles: false,
  description: 'Generic Description',
  containerTitle: 'Analytics',
}
const globalBridge = makeQueryBridge()

// Query stats for an entire org, but also apply a filter.
const filteredProviderProps = {
  refreshInterval,
  overrideTimeframe: TimePeriods.get(TimeframeKeys.SIX_HOUR),
  additionalFilter: [{
    dimension: 'application',
    type: 'in',
    values: ['app1'],
  } as ExploreFilter],
}

// Query stats for a single entity, no grouping.
const singleProviderProps = {
  refreshInterval,
  dimension: 'route',
  filterValue: 'blah',
}
const singleProviderBridge = makeQueryBridge({ dimensionNames: ['blah'] })

// Query stats for multiple entities.
const multiProviderProps = {
  refreshInterval,
  dimension: 'route',
  overrideTimeframe: TimePeriods.get(TimeframeKeys.CURRENT_MONTH),
}
const multiProviderBridge = makeQueryBridge({ dimensionNames: ['blah😀😀', 'arrgh'] })

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
