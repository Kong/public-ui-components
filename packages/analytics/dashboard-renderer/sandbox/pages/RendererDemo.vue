<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <div class="sandbox-container">
      <h2>Static Dashboard</h2>
      <DashboardRenderer
        :context="context"
        :definition="staticDefinition"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardDefinition, DashboardRendererContext } from '../../src'
import { ChartTypes, DashboardRenderer } from '../../src'
import { inject } from 'vue'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const context: DashboardRendererContext = {
  filters: {},
  timeSpec: '',
}

const staticDefinition: DashboardDefinition = {
  gridSize: {
    cols: 6,
    rows: 9,
  },
  tiles: [
    {
      id: 'chart1',
      chart: {
        type: ChartTypes.HorizontalBar,
      },
      query: {},
      position: {
        col: 1,
        row: 1,
      },
      size: {
        cols: 3,
        rows: 2,
      },
    },
    {
      id: 'chart2',
      chart: {
        type: ChartTypes.VerticalBar,
      },
      query: {},
      position: {
        col: 4,
        row: 1,
      },
      size: {
        cols: 3,
        rows: 2,
      },
    },
    {
      id: 'chart3',
      chart: {
        type: ChartTypes.HorizontalBar,
      },
      query: {},
      position: {
        col: 1,
        row: 3,
      },
      size: {
        cols: 6,
        rows: 2,
      },
    },
    {
      id: 'chart4',
      chart: {
        type: ChartTypes.Gauge,
        metricDisplay: ChartMetricDisplay.Full,
        reverseDataset: true,
        numerator: 0,
      },
      query: {},
      position: {
        col: 1,
        row: 5,
      },
      size: {
        cols: 1,
        rows: 1,
      },
    },
  ],
}

</script>
