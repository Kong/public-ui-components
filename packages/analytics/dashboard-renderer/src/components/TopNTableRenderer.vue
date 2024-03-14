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
        v-if="props.chartOptions?.entityLink"
        #name="{ record }"
      >
        <EntityLink
          :entity-link-data="{
            id: record.id,
            label: record.name,
            deleted: record.deleted
          }"
          :external-link="generateEntityUrl([
            '{geo}',
            'gateway-manager',
            '{idTuple0}',
            'gateway-services',
            '{idTuple1}'
          ])"
        />
      </template>
    </TopNTable>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps, TopNTableOptions } from '../types'
import { TopNTable } from '@kong-ui-public/analytics-chart'
import composables from '../composables'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<RendererProps<TopNTableOptions>>()

const generateEntityUrl = (routeParams: string[]): string => {
  return composables.useExternalLinkCreator(routeParams)
}

</script>
