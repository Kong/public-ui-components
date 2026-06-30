import type { GridTile } from '../types'
import type {
  TileConfig,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { isTableChartDefinition } from './tile-definition'

/**
 * Creates a chart tile copy with a new id, origin position, preserved size, and
 * copied chart metadata. Chart titles are prefixed when supported.
 *
 * @param tile The existing dashboard grid tile to duplicate.
 * @returns A chart tile config ready to be inserted into the dashboard.
 */
export const duplicateChartTile = (tile: GridTile<TileDefinition>): TileConfig => {
  let duplicatedDefinition: TileDefinition
  if (isTableChartDefinition(tile.meta)) {
    const { chart } = tile.meta

    duplicatedDefinition = {
      ...tile.meta,
      chart: {
        ...chart,
        chart_title: chart.chart_title ? `Copy of ${chart.chart_title}` : '',
      },
    }
  } else if ('chart_title' in tile.meta.chart) {
    duplicatedDefinition = {
      ...tile.meta,
      chart: {
        ...tile.meta.chart,
        chart_title: tile.meta.chart.chart_title ? `Copy of ${tile.meta.chart.chart_title}` : '',
      },
    }
  } else {
    duplicatedDefinition = {
      ...tile.meta,
      chart: { ...tile.meta.chart },
    }
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
