<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <div class="sandbox-container">
      <h2>Static Dashboard</h2>
      <br>
      <div class="controls">
        <KButton
          appearance="primary"
          size="small"
          @click="refresh"
        >
          Refresh
        </KButton>
        <KButton
          appearance="primary"
          size="small"
          @click="toggleFullscreen"
        >
          Toggle fullscreen
        </KButton>
        <KInputSwitch
          v-model="isToggled"
          :label="isToggled ? 'Custom styling' : 'Normal styling'"
        />
      </div>
      <DashboardRenderer
        ref="dashboardRendererRef"
        v-model="dashboardConfig"
        :class="{ 'custom-styling': isToggled }"
        :context="context"
      >
        <template #fullscreenHeader>
          <h2>Static Dashboard</h2>
          <KButton
            appearance="primary"
            size="small"
            @click="toggleFullscreen"
          >
            Toggle fullscreen
          </KButton>
        </template>
        <template #slot-1>
          <div class="slot-container">
            <h3>Custom Slot</h3>
            <p>This is a slotted tile</p>
          </div>
        </template>
        <template #slot-2>
          <div class="slot-container">
            <h3>Custom Slot 2</h3>
            <p>This is another slotted tile</p>
          </div>
        </template>
      </DashboardRenderer>
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
import type { Threshold } from '@kong-ui-public/analytics-chart'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const context: DashboardRendererContext = {
  filters: [],
  refreshInterval: 0,
}

const dashboardConfig = ref<DashboardConfig>({
  tile_height: 167,
  tiles: [
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'golden_signals',
          chart_title: 'Analytics Golden Signals',
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
      type: 'chart',
      definition: {
        chart: {
          type: 'top_n',
          chart_title: 'Top N chart of mock data',
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
          fit_to_content: true,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'top_n',
          chart_title: 'Top N chart of mock data',
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
          fit_to_content: true,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'horizontal_bar',
          chart_title: 'This is a really long title lorem ipsum dolor sit amet consectetur adipisicing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
          allow_csv_export: false,
        },
        query: {
          datasource: 'api_usage',
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
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_line',
          chart_title: 'Timeseries line chart of mock data',
          threshold: {
            'request_count': [
              { type: 'warning', value: 1000 },
              { type: 'error', value: 4000 },
            ],
          },
        },
        query: {
          datasource: 'basic',
          dimensions: ['time'],
          time_range: {
            type: 'absolute',
            start: '2024-01-01',
            end: '2024-02-01',
          },
          granularity: 'minutely',
        },
      },
      layout: {
        position: {
          col: 3,
          row: 2,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'gauge',
          metric_display: 'full',
          reverse_dataset: true,
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
      type: 'chart',
      definition: {
        chart: {
          type: 'slottable',
          id: 'slot-1',
        },
        query: {
          datasource: 'basic',
        },
      },
      layout: {
        position: {
          col: 1,
          row: 4,
        },
        size: {
          cols: 1,
          rows: 1,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'slottable',
          id: 'slot-2',
        },
        query: {
          datasource: 'basic',
        },
      },
      layout: {
        position: {
          col: 2,
          row: 4,
        },
        size: {
          cols: 3,
          rows: 1,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_bar',
          chart_title: 'Timeseries bar chart of mock data',
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
      type: 'chart',
      definition: {
        chart: {
          type: 'donut',
          chart_title: 'Donut chart of mock data',
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
      type: 'chart',
      definition: {
        chart: {
          type: 'top_n',
          chart_title: 'Top N chart of mock data',
          description: 'Description',
          entity_link: 'https://cloud.konghq.tech/us/analytics/entities/{id}',
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
          fit_to_content: true,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'single_value',
          chart_title: 'Single Value chart of mock data',
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
          fit_to_content: true,
        },
      },
    } satisfies TileConfig,
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'donut',
          chart_title: 'Permissions example',
        },
        query: {
          datasource: 'api_usage',
          dimensions: ['portal'],
        },
      },
      layout: {
        position: {
          col: 0,
          row: 8,
        },
        size: {
          cols: 1,
          rows: 2,
        },
      },
    } satisfies TileConfig,
  ],
})

const isToggled = ref(false)

const dashboardRendererRef = ref<InstanceType<typeof DashboardRenderer> | null>(null)


const refresh = () => {
  dashboardRendererRef.value?.refresh()
}

const toggleFullscreen = () => {
  dashboardRendererRef.value?.toggleFullscreen()
}
</script>

<style lang="scss" scoped>
h2 {
  margin-top: 0;
}

.controls {
  align-itmes: center;
  display: flex;
  gap: $kui-space-50;
  margin: 10px 0;
}

// Custom theme via CSS property overrides
.kong-ui-public-dashboard-renderer.custom-styling {
  --kui-border-width-10: 2px;
  --kui-font-size-30: 10px;
  --kui-font-size-40: 12px;
  --kui-font-size-50: 14px;
  --kui-font-size-60: 15px;
  --kui-color-border: rgba(90,120,240,0.40);
  --kui-space-70: 20px;

  // Overrides for Dashboard Tile and Top-N Table
  --kui-color-background-transparent: linear-gradient(#fafafa, #cdeffb), rgba(0,0,0,0.2);;
  --kui-color-background: linear-gradient(#fafafa, #cdeffb), rgba(0,0,0,0.2);;
}
</style>
