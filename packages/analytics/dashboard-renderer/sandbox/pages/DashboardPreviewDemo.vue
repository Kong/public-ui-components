<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Preview"
  >
    <KInputSwitch
      v-model="isPreview"
      :label="isPreview ? 'Use preview queryBridge (mock data)' : 'Use app\'s injected queryBridge'"
    />

    <div class="sandbox-container">
      <DashboardRenderer
        ref="dashboardRendererRef"
        v-model="dashboardConfig"
        :context="context"
        :preview="isPreview"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardRendererContext } from '../../src'
import { DashboardRenderer } from '../../src'
import { inject, ref } from 'vue'
import type {
  DashboardConfig,
  ExploreAggregations,
  TileConfig,
} from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import '@kong-ui-public/entities-shared/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])
const isPreview = ref(true)

const context: DashboardRendererContext = {
  filters: [],
  refreshInterval: 0,
}

const dashboardConfig = ref <DashboardConfig>({
  tiles: [
    {
      definition: {
        chart: {
          type: 'timeseries_line',
          chartTitle: 'Timeseries line chart of mock data',
          threshold: {
            'request_count': 3200,
          } as Record<ExploreAggregations, number>,
        },
        query: {
          datasource: 'advanced',
          metrics: [
            'request_count',
          ],
          dimensions: [
            'time',
          ],
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'timeseries_line',
          chartTitle: 'Latency Breakdown over Time',
        },
        query: {
          datasource: 'advanced',
          metrics: [
            'response_latency_p99',
            'response_latency_p95',
            'response_latency_p50',
          ],
          dimensions: [
            'time',
          ],
        },
      },
      layout: {
        position: {
          col: 3,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    /*
    {
      definition: {
        chart: {
          type: 'golden_signals',
          chartTitle: 'Analytics Golden Signals',
          description: '{timeframe}',
        },
        query: {
          datasource: 'basic',
        },
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
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'top_n',
          chartTitle: 'Top N chart of mock data',
          description: '{timeframe}',
        },
        query: {
          datasource: 'basic',
          limit: 1,
        },
      },
      layout: {
        position: {
          col: 0,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'top_n',
          chartTitle: 'Top N chart of mock data',
          description: 'Description',
        },
        query: {
          datasource: 'basic',
          limit: 3,
          time_range: {
            type: 'relative',
            time_range: 'current_month',
          },
        },
      },
      layout: {
        position: {
          col: 3,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'horizontal_bar',
          chartTitle: 'This is a really long title lorem ipsum dolor sit amet consectetur adipisicing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
          allowCsvExport: true,
        },
        query: {
          datasource: 'advanced',
          dimensions: ['route'],
          metrics: ['request_count'],
          time_range: {
            type: 'relative',
            time_range: '1h',
          },
        },
      },
      layout: {
        position: {
          col: 0,
          row: 2,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'gauge',
          metricDisplay: 'full',
          reverseDataset: true,
          numerator: 0,
        },
        query: {
          datasource: 'basic',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 4,
        },
        size: {
          cols: 1,
          rows: 1,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'timeseries_bar',
          chartTitle: 'Timeseries bar chart of mock data',
          stacked: true,
        },
        query: {
          datasource: 'basic',
          dimensions: ['time'],
        },
      },
      layout: {
        position: {
          col: 0,
          row: 5,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'donut',
          chartTitle: 'Donut chart of mock data',
        },
        query: {
          datasource: 'basic',
        },
      },
      layout: {
        position: {
          col: 3,
          row: 5,
        },
        size: {
          cols: 2,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'top_n',
          chartTitle: 'Top N chart of mock data',
          description: 'Description',
          entityLink: 'https://cloud.konghq.tech/us/analytics/entities/{id}',
        },
        query: {
          datasource: 'basic',
          limit: 3,
          dimensions: ['route'],
          time_range: {
            type: 'relative',
            time_range: 'current_month',
          },
        },
      },
      layout: {
        position: {
          col: 0,
          row: 7,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    } satisfies TileConfig,
    {
      definition: {
        chart: {
          type: 'single_value',
          chartTitle: 'Single Value chart of mock data',
        },
        query: {
          datasource: 'basic',
          limit: 1,
        },
      },
      layout: {
        position: {
          col: 3,
          row: 7,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    } satisfies TileConfig,
    */
  ],
})
</script>
