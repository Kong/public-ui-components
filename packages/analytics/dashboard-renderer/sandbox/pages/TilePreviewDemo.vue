<template>
  <SandboxLayout
    :links="appLinks"
    title="Tile Preview"
  >
    <template #controls>
      <h2>Examples</h2>
      <div class="example-actions">
        <KButton
          appearance="secondary"
          size="small"
          @click="loadChartExample"
        >
          Chart
        </KButton>
        <KButton
          appearance="secondary"
          size="small"
          @click="loadTableExample"
        >
          Table
        </KButton>
        <KButton
          appearance="secondary"
          size="small"
          @click="loadScatterExample"
        >
          Scatter
        </KButton>
      </div>

      <h2>Supplied data (optional)</h2>
      <div class="example-actions">
        <KButton
          v-for="mode in dataModes"
          :key="mode"
          :appearance="dataMode === mode ? 'primary' : 'secondary'"
          :data-testid="`data-mode-${mode}`"
          size="small"
          @click="dataMode = mode"
        >
          {{ mode }}
        </KButton>
      </div>

      <h2>Tile Definition (required)</h2>
      <textarea
        v-model="definitionText"
        rows="10"
      />

      <h2>Dashboard Renderer Context (required)</h2>
      <textarea
        v-model="contextText"
        rows="10"
      />

      <h2>Global Filters (optional)</h2>
      <textarea
        v-model="filtersText"
        rows="10"
      />
    </template>
    <div class="sandbox-container">
      <DashboardTilePreview
        v-if="context && definition && globalFilters"
        :context="context"
        :definition="definition"
        :global-filters="globalFilters"
        v-bind="dataProps"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardRendererContext, TileData } from '../../src'
import { DashboardTilePreview } from '../../src'
import { computed, ref, inject } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import type {
  AllFilters,
  ApiRequestsResult,
  PlatformTabularResponse,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { nonTsExploreResponse } from '../mock-data'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const stringifyExample = (value: unknown): string => JSON.stringify(value, null, 2)

const chartDefinitionExample = {
  chart: {
    type: 'vertical_bar',
    chart_title: 'Chart title (using mock data)',
  },
  query: {
    datasource: 'api_usage',
    dimensions: ['status_code_grouped'],
    metrics: ['request_count'],
  },
}

const tableDefinitionExample = {
  chart: {
    type: 'table',
    chart_title: 'Platform routes',
  },
  query: {
    datasource: 'platform',
    entity: 'route',
    columns: ['name', 'control_plane', 'gateway_service', 'env', 'team', 'region'],
    filters: [
      {
        field: 'env',
        operator: 'in',
        value: ['prod'],
      },
    ],
    page_size: 25,
  },
}

const scatterDefinitionExample = {
  chart: {
    type: 'scatter',
    chart_title: 'Response latency (supplied data only)',
  },
  query: {
    datasource: 'requests',
    metric: 'latencies_response_ms',
  },
}

// Sample responses for each tile type, used when "data" is selected below.
const tabularResponseExample: PlatformTabularResponse = {
  records: [
    { name: 'checkout', control_plane: 'prod-us', gateway_service: 'orders', env: 'prod', team: 'payments', region: 'us' },
    { name: 'login', control_plane: 'prod-eu', gateway_service: 'identity', env: 'prod', team: 'identity', region: 'eu' },
    { name: 'search', control_plane: 'prod-us', gateway_service: 'catalog', env: 'prod', team: 'discovery', region: 'us' },
  ],
  meta: {
    query_id: 'supplied-table',
    entity: 'route',
    columns: ['name', 'control_plane', 'gateway_service', 'env', 'team', 'region'],
    page_size: 25,
    display: {},
  },
}

const requestsStart = Date.parse('2024-03-05T04:34:00.000Z')
const requestsResponseExample: ApiRequestsResult = {
  results: Array.from({ length: 60 }, (_, i) => ({
    request_start: new Date(requestsStart + i * 30_000).toISOString(),
    latencies_response_ms: 20 + ((i * 37) % 180),
  })),
  meta: {
    query_id: 'supplied-requests',
    time_range: { start: '2024-03-05T04:34:00.000Z', end: '2024-03-05T05:04:00.000Z' },
    size: 60,
  },
}

const dataModes = ['query', 'data', 'undefined', 'null', 'Error'] as const
const dataMode = ref<typeof dataModes[number]>('query')

const sampleData = computed<TileData>(() => {
  if (definition.value?.chart.type === 'table') {
    return tabularResponseExample
  }

  return definition.value?.query.datasource === 'requests' ? requestsResponseExample : nonTsExploreResponse
})

// "query" omits the prop. The other modes pass it, including an explicit `undefined`.
const dataProps = computed(() => {
  switch (dataMode.value) {
    case 'query': return {}
    case 'data': return { data: sampleData.value }
    case 'undefined': return { data: undefined }
    case 'null': return { data: null }
    case 'Error': return { data: new Error('The host failed to load this data.') }
  }

  return {}
})

const contextText = ref(stringifyExample({
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '24h',
  },
  tz: 'utc',
  refreshInterval: 0,
  editable: true,
}))
const context = computed<DashboardRendererContext>(() => {
  try {
    return JSON.parse(contextText.value)
  } catch {
    return {
      filters: [],
    }
  }
})

const definitionText = ref(stringifyExample(chartDefinitionExample))
const definition = computed<TileDefinition>(() => {
  try {
    return JSON.parse(definitionText.value)
  } catch {
    return undefined
  }
})

const filtersText = ref('[]')
const globalFilters = computed<AllFilters[]>(() => {
  try {
    return JSON.parse(filtersText.value)
  } catch {
    return []
  }
})

const loadChartExample = () => {
  definitionText.value = stringifyExample(chartDefinitionExample)
}

const loadTableExample = () => {
  definitionText.value = stringifyExample(tableDefinitionExample)
}

const loadScatterExample = () => {
  definitionText.value = stringifyExample(scatterDefinitionExample)
}
</script>

<style lang="scss" scoped>
.sandbox-container {
  height: 500px;
}

.example-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-40, $kui-space-40);
}

textarea {
  background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  color: var(--kui-color-text, $kui-color-text);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  overflow: auto;
  padding: var(--kui-space-40, $kui-space-40);
  resize: vertical;
  scrollbar-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak) transparent;
  scrollbar-width: thin;
  -moz-tab-size: 4;
  tab-size: 4;
  width: 100%;
}

textarea:focus {
  border-color: var(--kui-color-border-primary, $kui-color-border-primary);
  box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
  outline: none;
}
</style>
