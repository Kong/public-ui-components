<template>
  <div>
    <MetricsProviderInternal v-bind="globalProviderProps">
      <MetricsConsumer />
    </MetricsProviderInternal>
  </div>
  <div v-if="!USE_REAL_DATA">
    <MetricsProviderInternal v-bind="filteredProviderProps">
      <MetricsConsumer />
    </MetricsProviderInternal>
  </div>
  <div>
    <MetricsProviderInternal v-bind="singleProviderProps">
      <MetricsConsumer />
    </MetricsProviderInternal>
  </div>
  <div>
    <MetricsProviderInternal v-bind="multiProviderProps">
      <div id="route-blah">
        <MetricsConsumer lookup-key="blah😀😀" />
      </div>
      <div id="route-arrgh">
        <MetricsConsumer lookup-key="arrgh" />
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
}

// Query stats for an entire org, but also apply a filter.
const filteredProviderProps = {
  refreshInterval,
  hasTrendAccess,
  dataFetcher: makeDataFetcher(),
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
}

</script>
