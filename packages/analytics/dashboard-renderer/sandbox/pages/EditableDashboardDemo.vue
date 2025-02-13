<template>
  <SandboxLayout
    :links="appLinks"
    title="Editable Dashboard"
  >
    <div class="sandbox-container">
      <br>
      <div style="display: flex; gap: 5px; margin: 5px;">
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
      </div>
      <DashboardRenderer
        ref="dashboardRendererRef"
        can-edit
        :config="dashboardConfig"
        :context="context"
        @edit-tile="onEditTile"
        @update-tiles="onUpdateTiles"
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
  DashboardTileType,
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
      id: crypto.randomUUID(),
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
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      id: crypto.randomUUID(),
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
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
    {
      id: crypto.randomUUID(),
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
          row: 3,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } satisfies TileConfig,
  ],
})

const onEditTile = (tile: GridTile<TileDefinition>) => {
  console.log('@edit-tile', tile)

  const chartTypeToggleMap = {
    timeseries_line: 'timeseries_bar',
    timeseries_bar: 'timeseries_line',
    horizontal_bar: 'vertical_bar',
    vertical_bar: 'horizontal_bar',
    gauge: 'gauge',
    golden_signals: 'golden_signals',
    slottable: 'slottable',
    top_n: 'top_n',
  }

  dashboardConfig.value.tiles = dashboardConfig.value.tiles.map(t => {

    const newType = chartTypeToggleMap[t.definition.chart.type] || t.definition.chart.type

    if (t.id === tile.id) {
      return {
        ...t,
        definition: {
          ...t.definition,
          chart: {
            ...t.definition.chart,
            type: newType as DashboardTileType,
            chartTitle: `This is a ${newType} chart`,
          } as any,
        },
      }
    }
    return t
  })
}

const dashboardRendererRef = ref<InstanceType<typeof DashboardRenderer> | null>(null)


const refresh = () => {
  dashboardRendererRef.value?.refresh()
}
let last = 0
const addTile = () => {
  last = (last + 1) % 2
  dashboardConfig.value.tiles.push({
    id: crypto.randomUUID(),
    definition: {
      chart: {
        type: ['timeseries_line', 'timeseries_bar'][last] as any,
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
        row: 0,
      },
      size: {
        cols: 3,
        rows: 2,
      },
    },
  })
}

const onUpdateTiles = (tiles: TileConfig[]) => {
  console.log('@update-tiles', tiles)
  dashboardConfig.value.tiles = tiles
}
</script>
