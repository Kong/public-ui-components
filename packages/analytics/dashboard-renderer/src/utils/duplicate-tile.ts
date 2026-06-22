import type { GridTile } from '../types'
import type {
  ChartTileDefinition,
  TableTileDefinition,
  TileConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

const isSlottable = (chart: ChartTileDefinition['chart']) => {
  return chart.type === 'slottable'
}

/**
 * Creates a table tile copy with a new id, origin position, preserved size, and
 * a copied table config whose title is prefixed when present.
 *
 * @param tile The existing dashboard grid tile to duplicate.
 * @returns A table tile config ready to be inserted into the dashboard.
 */
export const duplicateTableTile = (tile: GridTile<TileDefinition>): TileConfig => {
  const tableMeta = tile.meta as TableTileDefinition
  const config = {
    ...tableMeta.config,
    title: tableMeta.config.title ? `Copy of ${tableMeta.config.title}` : '',
  }

  return {
    id: crypto.randomUUID(),
    type: 'table',
    definition: {
      ...tableMeta,
      config,
    },
    layout: {
      position: {
        col: 0,
        row: 0,
      },
      size: tile.layout.size,
    },
  }
}

/**
 * Creates a chart tile copy with a new id, origin position, preserved size, and
 * copied chart metadata. Non-slottable chart titles are prefixed when present.
 *
 * @param tile The existing dashboard grid tile to duplicate.
 * @returns A chart tile config ready to be inserted into the dashboard.
 */
export const duplicateChartTile = (tile: GridTile<TileDefinition>): TileConfig => {
  const chartMeta = tile.meta as ChartTileDefinition
  const chart = isSlottable(chartMeta.chart)
    ? { ...chartMeta.chart }
    : {
      ...chartMeta.chart,
      chart_title: chartMeta.chart.chart_title ? `Copy of ${chartMeta.chart.chart_title}` : '',
    }

  return {
    id: crypto.randomUUID(),
    type: 'chart',
    definition: {
      ...chartMeta,
      chart,
    },
    layout: {
      position: {
        col: 0,
        row: 0,
      },
      size: tile.layout.size,
    },
  }
}
