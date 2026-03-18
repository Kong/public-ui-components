<template>
  <SandboxLayout
    :links="appLinks"
    title="Tile Preview"
  >
    <template #controls>
      <h2>Tile Definition (required)</h2>
      <textarea
        v-model="definitionText"
        rows="10"
      />

      <h2>Dashboard Renderer Context (required)</h2>
      <KSegmentedControl
        v-model="chartRenderer"
        class="renderer-select"
        :options="rendererOptions"
      />
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
import type { ChartRenderer, DashboardRendererContext } from '../../src'
import { DashboardTilePreview } from '../../src'
import { computed, inject, ref, watch } from 'vue'
import type { SegmentedControlOption } from '@kong/kongponents'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import type {
  AllFilters,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const createDefaultContext = (chartRenderer: ChartRenderer): DashboardRendererContext => ({
  chartRenderer,
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '24h',
  },
  tz: 'utc',
  refreshInterval: 0,
  editable: true,
})

const rendererOptions: Array<SegmentedControlOption<ChartRenderer>> = [
  { label: 'Chart.js', value: 'chartjs' },
  { label: 'ECharts', value: 'echarts' },
]

const chartRenderer = ref<ChartRenderer>('chartjs')
const contextText = ref(`{
  "chartRenderer": "chartjs",
  "filters": [],
  "timeSpec": {
    "type": "relative",
    "time_range": "24h"
  },
  "tz": "utc",
  "refreshInterval": 0,
  "editable": true
}`)
const parsedContext = computed<DashboardRendererContext | null>(() => {
  try {
    return JSON.parse(contextText.value)
  } catch {
    return null
  }
})

const context = computed<DashboardRendererContext>(() => {
  return parsedContext.value ?? createDefaultContext(chartRenderer.value)
})

watch(parsedContext, (value) => {
  if (value?.chartRenderer) {
    chartRenderer.value = value.chartRenderer
  }
}, { immediate: true })

watch(chartRenderer, (value) => {
  const nextContext = {
    ...(parsedContext.value ?? createDefaultContext(value)),
    chartRenderer: value,
  }

  contextText.value = JSON.stringify(nextContext, null, 2)
})

const definitionText = ref(`{
  "chart": {
    "type": "vertical_bar",
    "chart_title": "Chart title (using mock data)"
  },
  "query": {
    "datasource": "api_usage",
    "dimensions": ["status_code_grouped"],
    "metrics": ["request_count"]
  }
}`)
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
</script>

<style lang="scss" scoped>
.sandbox-container {
  height: 500px;
}

.renderer-select {
  margin-bottom: 12px;
  max-width: 320px;
}

textarea {
  background-color: $kui-color-background-neutral-weakest;
  border: 1px solid $kui-color-border-neutral-weak;
  border-radius: 4px;
  color: #333333;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: $kui-font-size-20;
  line-height: 1.5;
  overflow: auto;
  padding: 10px;
  resize: vertical;
  scrollbar-color: #bbbbbb #e0e0e0;
  scrollbar-width: thin;
  -moz-tab-size: 4;
  tab-size: 4;
  width: 100%;
}

textarea::-webkit-scrollbar {
  width: 5px;
}

textarea::-webkit-scrollbar-track {
  background: #e0e0e0;
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb {
  background-color: #bbbbbb;
  border: 1px solid #aaaaaa;
  border-radius: 10px;
}

textarea:focus {
  border-color: white;
  box-shadow: 0 0 0 2px #eee;
  outline: none;
}
</style>
