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
        v-if="hasEntityLinkOptions"
        #name="{ record }"
      >
        <AsyncEntityLink
          v-if="!record.isEmpty && getEntityLink(record)"
          :entity-link-data="{
            id: record.id,
            label: record.name,
            deleted: record.deleted,
          }"
          :external-link="parseLink(record)"
        />
        <template v-else>
          <i v-if="record.name === 'empty'">{{ record.name }}</i>
          <span v-else>{{ record.name }}</span>
        </template>
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
import { computed, defineAsyncComponent, inject } from 'vue'
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

const hasEntityLinkOptions = computed((): boolean => {
  return !!props.chartOptions.entity_link || !!Object.keys(props.chartOptions.entity_links || {}).length
})

const getMappedEntityLink = (dimension: string): string => {
  const entityLinks = props.chartOptions.entity_links

  if (!entityLinks) {
    return ''
  }

  return entityLinks[dimension] || Object.entries(entityLinks).find(([key]) => key.toLowerCase() === dimension.toLowerCase())?.[1] || ''
}

const isPrimaryDimensionRecord = (record: TopNTableRecord): boolean => {
  const primaryDimension = record.dimensions?.[0]?.dimension

  return !primaryDimension || primaryDimension === record.dimension
}

const getEntityLink = (record: TopNTableRecord): string => {
  return getMappedEntityLink(record.dimension) || (isPrimaryDimensionRecord(record) ? props.chartOptions.entity_link || '' : '')
}

const parseLink = (record: TopNTableRecord) => {
  const entityLink = getEntityLink(record)

  if (entityLink) {
    if (record.id.includes(':')) {
      const [cpId, entityId] = record.id.split(':')

      return entityLink.replace(CP_ID_TOKEN, cpId).replace(ENTITY_ID_TOKEN, entityId)
    } else {
      return entityLink.replace(ENTITY_ID_TOKEN, record.id)
    }
  }

  return ''
}

</script>
