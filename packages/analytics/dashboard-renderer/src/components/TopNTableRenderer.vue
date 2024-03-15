<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
  >
    <TopNTable
      :data="data"
      :description="chartOptions.description"
      :synthetics-data-key="chartOptions.syntheticsDataKey"
      :title="chartOptions.chartTitle || ''"
    >
      <template
        v-if="props.chartOptions.entityLink"
        #name="{ record }"
      >
        <EntityLink
          :entity-link-data="{
            id: record.id,
            label: record.name,
            deleted: record.deleted
          }"
          :external-link="parseLink(record)"
        />
      </template>
    </TopNTable>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps, TopNTableOptions } from '../types'
import { CP_ID_TOKEN, ENTITY_ID_TOKEN } from '../constants'
import { TopNTable } from '@kong-ui-public/analytics-chart'
import type { TopNTableRecord } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'
import { EntityLink } from '@kong-ui-public/entities-shared'

const props = defineProps<RendererProps<TopNTableOptions>>()

const parseLink = (record: TopNTableRecord) => {
  if (props.chartOptions?.entityLink) {
    if (record.id.includes(':')) {
      const [cpId, entityId] = record.id.split(':')

      return props.chartOptions.entityLink.replace(CP_ID_TOKEN, cpId).replace(ENTITY_ID_TOKEN, entityId)
    } else {
      return props.chartOptions.entityLink.replace(ENTITY_ID_TOKEN, record.id)
    }
  }
  return ''
}

</script>
