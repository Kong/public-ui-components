import type { DashboardConfig, TileConfig } from '@kong-ui-public/analytics-utilities'

import { DASHBOARD_COLS, LEGACY_DASHBOARD_COLS } from '../constants'

const SCALE = DASHBOARD_COLS / LEGACY_DASHBOARD_COLS

const scaleTile = (tile: TileConfig): TileConfig => ({
  ...tile,
  layout: {
    ...tile.layout,
    position: { ...tile.layout.position, col: tile.layout.position.col * SCALE },
    size: { ...tile.layout.size, cols: tile.layout.size.cols * SCALE },
  },
})

/**
 * Scales a 6 column layout to 12 columns. Configs without `columns` predate the 12 column
 * grid, so their tile positions and widths are doubled and `columns` is set
 *
 * @param config - The dashboard configuration.
 * @returns The configuration in 12 column units.
 */
export const migrateLegacyColumns = (config: DashboardConfig): DashboardConfig => {
  if (config.columns !== undefined) {
    return config
  }

  return {
    ...config,
    columns: DASHBOARD_COLS,
    tiles: config.tiles.map(scaleTile),
  }
}
