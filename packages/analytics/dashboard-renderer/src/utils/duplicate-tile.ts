import type { GridTile } from '../types'
import type {
  TileConfig,
  TileDefinition,
  TileLayout,
} from '@kong-ui-public/analytics-utilities'

/**
 * Creates a tile copy with a new id, origin position, and preserved size. Slottable tiles get a new id (slot name).
 * Legacy Chart tiles get copied chart metadata, with titles prefixed when supported.
 *
 * @param tile The existing dashboard grid tile to duplicate.
 * @returns A tile config ready to be inserted into the dashboard.
 */
export const duplicateChartTile = (tile: GridTile<TileDefinition>): TileConfig => {
  const layout: TileLayout = {
    position: {
      col: 0,
      row: 0,
    },
    size: tile.layout.size,
  }

  if (tile.type === 'slottable') {
    return {
      id: crypto.randomUUID(),
      type: 'slottable',
      layout,
    }
  }

  const meta = tile.meta as TileDefinition
  const duplicatedDefinition = {
    ...meta,
    chart: { ...meta.chart },
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
    layout,
  }
}
