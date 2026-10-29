<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <div class="sandbox-container">
      <h2>Multiple Dashboards</h2>
      <p>
        A single <code>DashboardRenderer</code> can take an array of sections as its
        <code>v-model</code>. Each section has an optional <code>title</code> and
        <code>description</code> and a <code>definition</code> dashboard config, which applies
        its own <code>preset_filters</code>.
      </p>
      <br>
      <div class="controls">
        <KButton
          appearance="primary"
          size="small"
          @click="refresh"
        >
          Refresh
        </KButton>
        <KInputSwitch
          v-model="editable"
          :label="editable ? 'Editable' : 'Read only'"
        />
      </div>
      <DashboardRenderer
        ref="dashboardRendererRef"
        v-model="dashboardConfigs"
        :context="context"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardRendererContext, DashboardSection } from '../../src'
import { DashboardRenderer } from '../../src'
import { computed, inject, ref } from 'vue'
import type { TileConfig } from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import '@kong-ui-public/entities-shared/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const dashboardRendererRef = ref<InstanceType<typeof DashboardRenderer> | null>(null)
const editable = ref(false)

const refresh = () => dashboardRendererRef.value?.refresh()

const context = computed<DashboardRendererContext>(() => ({
  filters: [],
  refreshInterval: 0,
  editable: editable.value,
}))

const singleValueTile = (title: string, metric: string, col: number): TileConfig => ({
  type: 'chart',
  definition: {
    chart: {
      type: 'single_value',
      chart_title: title,
    },
    query: {
      datasource: 'basic',
      dimensions: ['time'],
      granularity: 'trend',
      metrics: [metric],
    },
  },
  layout: {
    position: { col, row: 0 },
    // Compact single value: the row shrinks to fit its content.
    size: { cols: 2, rows: 1, fit_to_content: true },
  },
})

const overviewTiles: TileConfig[] = [
  singleValueTile('Requests', 'request_count', 0),
  singleValueTile('Average latency', 'response_latency_average', 2),
  singleValueTile('P99 latency', 'response_latency_p99', 4),
]

const dashboardConfigs = ref<DashboardSection[]>([
  {
    title: 'Overview',
    anchorId: 'overview',
    description: 'High-level traffic health',
    definition: {
      tile_height: 167,
      tiles: overviewTiles,
    },
  },
  {
    title: 'Routes (production only)',
    definition: {
      tile_height: 167,
      // Applied only to tiles in this dashboard, merged with context.filters.
      preset_filters: [
        {
          field: 'env',
          operator: 'in',
          value: ['prod'],
        },
      ],
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'table',
              chart_title: 'Platform routes',
            },
            query: {
              datasource: 'platform',
              entity: 'route',
              columns: ['name', 'control_plane', 'gateway_service', 'env', 'team', 'region'],
              page_size: 25,
            },
          },
          layout: {
            position: { col: 0, row: 0 },
            size: { cols: 6, rows: 3 },
          },
        } satisfies TileConfig,
      ],
    },
  },
  {
    title: 'Breakdown',
    definition: {
      tile_height: 167,
      tiles: [
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'top_n',
              chart_title: 'Top N chart of mock data',
            },
            query: {
              datasource: 'basic',
              limit: 3,
            },
          },
          layout: {
            position: { col: 0, row: 0 },
            size: { cols: 3, rows: 2 },
          },
        } satisfies TileConfig,
        {
          type: 'chart',
          definition: {
            chart: {
              type: 'horizontal_bar',
              chart_title: 'Requests by route',
            },
            query: {
              datasource: 'api_usage',
              dimensions: ['route'],
              metrics: ['request_count'],
            },
          },
          layout: {
            position: { col: 3, row: 0 },
            size: { cols: 3, rows: 2 },
          },
        } satisfies TileConfig,
      ],
    },
  },
])
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 0 20px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
