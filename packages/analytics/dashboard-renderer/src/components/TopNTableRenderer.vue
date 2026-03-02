<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  >
    <TopNTable
      :data="data"
      :synthetics-data-key="chartOptions.synthetics_data_key"
    >
      <template
        v-if="props.chartOptions.entity_link"
        #name="{ record }"
      >
        <AsyncEntityLink
          :entity-link-data="{
            id: record.id,
            label: record.name,
            deleted: record.deleted,
          }"
          :external-link="parseLink(record)"
        />
      </template>
    </TopNTable>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import type { AnalyticsBridge, TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import { CP_ID_TOKEN, ENTITY_ID_TOKEN, INJECT_QUERY_PROVIDER } from '../constants'
import { TopNTable } from '@kong-ui-public/analytics-chart'
import type { TopNTableRecord } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'
import { inject, defineAsyncComponent } from 'vue'
import FallbackEntityLink from './FallbackEntityLink.vue'

const props = defineProps<RendererProps<TopNTableOptions>>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

// EntityLink is an optional component -- it might be available, or it might not be.
// Attempt to fetch it from the analytics bridge.
// We don't use `loader` / `errorComponent` here because Vue treats not finding the
// component as an error, and spams the console accordingly.
const AsyncEntityLink = defineAsyncComponent(async () => {
  if (queryBridge?.fetchComponent) {
    try {
      return await queryBridge.fetchComponent('EntityLink')
    } catch {
      return FallbackEntityLink
    }
  }

  return FallbackEntityLink
})

const parseLink = (record: TopNTableRecord) => {
  if (props.chartOptions?.entity_link) {
    if (record.id.includes(':')) {
      const [cpId, entityId] = record.id.split(':')

      // @ts-ignore we guarantee both cpId and entityId due to the `includes` check
      return props.chartOptions.entity_link.replace(CP_ID_TOKEN, cpId).replace(ENTITY_ID_TOKEN, entityId)
    } else {
      return props.chartOptions.entity_link.replace(ENTITY_ID_TOKEN, record.id)
    }
  }
  return ''
}

</script>
