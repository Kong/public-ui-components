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
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardRendererContext } from '../../src'
import { DashboardTilePreview } from '../../src'
import { computed, ref, inject } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import type {
  AllFilters,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

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
</script>

<style lang="scss" scoped>
.sandbox-container {
  height: 500px;
}

.example-actions {
  display: flex;
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
