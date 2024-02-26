<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <div class="sandbox-container">
      <h2>Static Dashboard</h2>
      <DashboardRenderer
        :config="(dashboardConfig as DashboardConfig)"
        :context="context"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardConfig, DashboardRendererContext, TileConfig } from '../../src'
import { ChartTypes, DashboardRenderer } from '../../src'
import { inject } from 'vue'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '24h',
  },
}

const dashboardConfig: DashboardConfig = {
  gridSize: {
    cols: 6,
    rows: 9,
  },
  tiles: [
    {
      definition: {
        chart: {
          type: ChartTypes.GoldenSignals,
        },
        query: {},
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    } as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.HorizontalBar,
          chartTitle: 'Horizontal bar chart of mock data',
        },
        query: {},
      },
      layout: {
        position: {
          col: 0,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.VerticalBar,
        },
        query: {},
      },
      layout: {
        position: {
          col: 3,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.TopN,
          chartTitle: 'Top N chart of mock data',
          description: 'Description',
        },
        query: {},
      },
      layout: {
        position: {
          col: 0,
          row: 3,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.TimeseriesLine,
          fill: true,
        },
        query: {
          dimensions: ['time'],
        },
      },
      layout: {
        position: {
          col: 3,
          row: 3,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.Gauge,
          metricDisplay: ChartMetricDisplay.Full,
          reverseDataset: true,
          numerator: 0,
        },
        query: {},
      },
      layout: {
        position: {
          col: 0,
          row: 5,
        },
        size: {
          cols: 1,
          rows: 1,
        },
      },
    } as TileConfig,
  ],
}

</script>
