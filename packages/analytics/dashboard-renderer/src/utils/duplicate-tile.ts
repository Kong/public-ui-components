import type { GridTile } from '../types'
import type {
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
  const duplicatedDefinition = {
    ...tile.meta,
    chart: { ...tile.meta.chart },
  } as TileDefinition

  if ('chart_title' in duplicatedDefinition.chart) {
    duplicatedDefinition.chart.chart_title = duplicatedDefinition.chart.chart_title
      ? `Copy of ${duplicatedDefinition.chart.chart_title}`
      : ''
  }

  return {
    id: crypto.randomUUID(),
    type: 'chart',
    definition: duplicatedDefinition,
    layout: {
      position: {
        col: 0,
        row: 0,
      },
      size: tile.layout.size,
    },
  }
}
