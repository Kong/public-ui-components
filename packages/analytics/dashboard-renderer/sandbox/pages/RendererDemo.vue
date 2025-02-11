<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <div class="sandbox-container">
      <h2>Static Dashboard</h2>
      <KInputSwitch
        v-model="isToggled"
        :label="isToggled ? 'Custom styling' : 'Normal styling'"
      />
      <br>
      <KButton
        appearance="primary"
        size="small"
        @click="refresh"
      >
        refresh
      </KButton>
      <KButton
        size="small"
        @click="addTile"
      >
        Add tile
      </KButton>
      <DashboardRenderer
        ref="dashboardRendererRef"
        can-remove-tiles
        :class="{ 'custom-styling': isToggled}"
        :config="dashboardConfig"
        :context="context"
        draggable
        @edit-tile="onEditTile"
        @remove-tile="onRemoveTile"
      >
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
import type { DashboardRendererContext, GridTile } from '../../src'
import { DashboardRenderer } from '../../src'
import { inject, ref } from 'vue'
import type {
  DashboardConfig,
  ExploreAggregations,
  TileConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const context: DashboardRendererContext = {
  filters: [],
  refreshInterval: 0,
  editable: true,
}

const dashboardConfig = ref <DashboardConfig>({
  gridSize: {
    cols: 6,
    rows: 7,
  },
  tileHeight: 167,
  tiles: [
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
          type: 'timeseries_line',
          chartTitle: 'Timeseries line chart of mock data',
          threshold: {
            'request_count': 3200,
          } as Record<ExploreAggregations, number>,
        },
        query: {
          datasource: 'basic',
          dimensions: ['time'],
          time_range: {
            type: 'absolute',
            start: '2024-01-01',
            end: '2024-02-01',
          },
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
          type: 'timeseries_line',
          chartTitle: 'Timeseries line chart of mock data',
          threshold: {
            'request_count': 3200,
          } as Record<ExploreAggregations, number>,
        },
        query: {
          datasource: 'basic',
          dimensions: ['time'],
          time_range: {
            type: 'absolute',
            start: '2024-01-01',
            end: '2024-02-01',
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
          rows: 2,
        },
      },
    } satisfies TileConfig,
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
          datasource: 'basic',
          dimensions: ['time'],
          time_range: {
            type: 'absolute',
            start: '2024-01-01',
            end: '2024-02-01',
          },
        },
      },
      layout: {
        position: {
          col: 0,
          row: 9,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
  ],
})

const isToggled = ref(false)

const onEditTile = (tile: GridTile<TileDefinition>) => {
  console.log('@edit-tile', tile)
}

const dashboardRendererRef = ref<InstanceType<typeof DashboardRenderer> | null>(null)


const refresh = () => {
  dashboardRendererRef.value?.refresh()
}

const addTile = () => {
  dashboardConfig.value.tiles.push({
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
        col: -1,
        row: -1,
      },
      size: {
        cols: 3,
        rows: 2,
        fitToContent: true,
      },
    },
  })
}

const onRemoveTile = (tile: GridTile<TileDefinition>) => {
  console.log('@remove-tile', tile)
  console.log('before:', dashboardConfig.value.tiles.length)
  dashboardConfig.value.tiles = dashboardConfig.value.tiles.filter((_, i) => i !== tile.id)
  console.log('after:', dashboardConfig.value.tiles.length)
}
</script>

<style lang="scss" scoped>
.k-input-switch {
  margin-bottom: 20px;
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
