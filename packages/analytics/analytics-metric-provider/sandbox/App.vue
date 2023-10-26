<template>
  <h4>Global props, Large cards</h4>
  <div>
    <MetricsProviderInternal v-bind="globalProviderProps">
      <MetricsConsumer
        :card-size="MetricCardSize.Large"
      />
    </MetricsProviderInternal>
  </div>

  <h4>Global props, Small cards</h4>
  <div>
    <MetricsProviderInternal v-bind="globalProviderProps">
      <MetricsConsumer
        :card-size="MetricCardSize.Small"
      />
    </MetricsProviderInternal>
  </div>

  <h4>Filtered props, LargeCompact cards</h4>
  <div v-if="!USE_REAL_DATA">
    <MetricsProviderInternal v-bind="filteredProviderProps">
      <MetricsConsumer
        :card-size="MetricCardSize.LargeCompact"
      />
    </MetricsProviderInternal>
  </div>
  <div>
    <MetricsProviderInternal v-bind="singleProviderProps">
      <MetricsConsumer :card-size="MetricCardSize.LargeCompact" />
    </MetricsProviderInternal>
  </div>

  <h4>Multiple Entities, Large cards</h4>
  <div>
    <MetricsProviderInternal v-bind="multiProviderProps">
      <div id="route-blah">
        <MetricsConsumer
          :card-size="MetricCardSize.Large"
          lookup-key="blah😀😀"
        />
      </div>
      <div id="route-arrgh">
        <MetricsConsumer
          :card-size=" MetricCardSize.Large"
          lookup-key="arrgh"
        />
      </div>
    </MetricsProviderInternal>
  </div>
</template>
<script setup lang="ts">
import type { DataFetcher, ExploreV2Query } from '../src/types'
import { EXPLORE_V2_DIMENSIONS, EXPLORE_V2_FILTER_TYPES } from '../src/types'
import MetricsConsumer from '../src/components/MetricsConsumer.vue'
import MetricsProviderInternal from '../src/components/MetricsProviderInternal.vue'
import type { MockOptions } from '../src/mockExploreResponse'
import { mockExploreResponse } from '../src/mockExploreResponse'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import type { QueryTime, Timeframe } from '@kong-ui-public/analytics-utilities'
import { DeltaQueryTime, TimePeriods, TimeframeKeys } from '@kong-ui-public/analytics-utilities'
import { MetricCardSize } from '@kong-ui-public/metric-cards'

const refreshInterval = 60 * 1000
const hasTrendAccess = true

// Need to have a local proxy running forwarding traffic to konnect api to hit real data.
const USE_REAL_DATA = false

const defaultQueryTime = new DeltaQueryTime(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe)

const makeDataFetcher = (opts?: MockOptions): DataFetcher => {

  const options = {
    method: 'POST',
    url: 'https://localhost:8443/konnect-explore-proxy',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      startMs: defaultQueryTime.startMs(),
      endMs: defaultQueryTime.endMs(),
    },
    data: {},
  }

  return (queryTime: QueryTime, query: ExploreV2Query) => {

    if (USE_REAL_DATA) {
      options.data = query
      options.params = {
        startMs: queryTime.startMs(),
        endMs: queryTime.endMs(),
      }
      return axios.request(options)
    } else {

      const result = mockExploreResponse(query, queryTime.startMs(), queryTime.endMs(), opts)

      const response: AxiosResponse = {
        data: result,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }

      return Promise.resolve(response)
    }
  }
}

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = {
  refreshInterval,
  hasTrendAccess,
  dataFetcher: makeDataFetcher(),
  overrideTimeframe: TimePeriods.get(TimeframeKeys.SIX_HOUR),
  longCardTitles: false,
  description: 'Generic Description',
}

// Query stats for an entire org, but also apply a filter.
const filteredProviderProps = {
  refreshInterval,
  hasTrendAccess,
  dataFetcher: makeDataFetcher(),
  overrideTimeframe: TimePeriods.get(TimeframeKeys.SIX_HOUR),
  additionalFilter: [{
    dimension: EXPLORE_V2_DIMENSIONS.APPLICATION,
    type: EXPLORE_V2_FILTER_TYPES.IN,
    values: ['app1'],
  }],
}

// Query stats for a single entity, no grouping.
const singleProviderProps = {
  refreshInterval,
  hasTrendAccess,
  dimension: EXPLORE_V2_DIMENSIONS.ROUTE,
  filterValue: 'blah',
  dataFetcher: makeDataFetcher({ dimensionNames: ['blah'] }),
}

// Query stats for multiple entities.
const multiProviderProps = {
  refreshInterval,
  hasTrendAccess,
  dimension: EXPLORE_V2_DIMENSIONS.ROUTE,
  dataFetcher: makeDataFetcher({ dimensionNames: ['blah😀😀', 'arrgh'] }),
  overrideTimeframe: TimePeriods.get(TimeframeKeys.CURRENT_MONTH),
}

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
