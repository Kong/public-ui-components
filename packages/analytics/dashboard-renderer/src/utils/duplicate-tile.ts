import type { GridTile } from '../types'
import type {
  ChartTileDefinition,
  TableChartTileDefinition,
  TileConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

/**
 * Creates a chart tile copy with a new id, origin position, preserved size, and
 * copied chart metadata. Chart titles are prefixed when supported.
 *
 * @param tile The existing dashboard grid tile to duplicate.
 * @returns A chart tile config ready to be inserted into the dashboard.
 */
export const duplicateChartTile = (tile: GridTile<TileDefinition>): TileConfig => {
  const { chart } = tile.meta

  if (chart.type === 'table') {
    const tableMeta = tile.meta as TableChartTileDefinition

    return {
      id: crypto.randomUUID(),
      type: 'chart',
      definition: {
        ...tableMeta,
        chart: {
          ...chart,
          title: chart.title ? `Copy of ${chart.title}` : '',
        },
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

  const chartMeta = tile.meta as ChartTileDefinition
  const chartTitle = 'chart_title' in chart ? chart.chart_title : undefined
  const duplicatedChart = chart.type === 'slottable'
    ? { ...chart }
    : {
      ...chart,
      chart_title: chartTitle ? `Copy of ${chartTitle}` : '',
    }

  return {
    id: crypto.randomUUID(),
    type: 'chart',
    definition: {
      ...chartMeta,
      chart: duplicatedChart,
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
