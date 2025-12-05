import type {
  DashboardConfig,
  TileConfig,
} from '@kong-ui-public/analytics-utilities'

import { DASHBOARD_COLS } from '../constants'

/**
 * Filters out `api_usage` datasource tiles for `basic` analytics.
 *
 * @param tile - The tile configuration object.
 * @returns The updated tile configuration object.
 */
const processTileForBasicTier = (tile: TileConfig): TileConfig | undefined => {
  const query = tile.definition?.query

  if (!query) {
    return tile
  }

  if (query.datasource === 'api_usage') {
    console.warn('[@kong-ui-public/dashboard-renderer] A tile was filtered out for the Basic Tier', tile)

    return undefined
  }

  return tile
}

/**
 * Updates the datasource of a tile's query to 'api_usage' if it's currently 'basic'.
 *
 * @param tile - The tile configuration object.
 * @returns The updated tile configuration object.
 */
const processTileForAdvancedTier = (tile: TileConfig): TileConfig => {
  const query = tile.definition?.query

  if (!query) {
    return tile
  }

  const updatedQuery = {
    ...query,
    datasource: query.datasource === 'basic' ? 'api_usage' : query.datasource,
  }

  return {
    ...tile,
    definition: ({
      ...tile.definition,
      query: updatedQuery,
    } as typeof tile.definition),
  }
}

/**
 * Repositions tiles sequentially to avoid gaps when tiles are removed.
 * The algorithm lays out tiles row by row based on their widths (cols) and heights (rows).
 *
 * @param tiles - The array of tile configuration objects.
 * @returns The updated array of tile configuration objects.
 */
const repositionTiles = (tiles: TileConfig[]): TileConfig[] => {
  if (!tiles.length) {
    return []
  }

  let currentRow = 0
  let currentCol = 0
  let rowHeight = 0

  const newTiles: TileConfig[] = []

  for (const tile of tiles) {
    // Determine this tile's span
    const colSpan = tile.layout?.size?.cols ?? 1
    const rowSpan = tile.layout?.size?.rows ?? 1

    // If the tile won't fit on the current row, move to next row
    if (currentCol + colSpan > DASHBOARD_COLS) {
      currentRow += rowHeight
      currentCol = 0
      rowHeight = 0
    }

    const newTile: TileConfig = {
      ...tile,
      layout: {
        ...tile.layout,
        position: {
          ...(tile.layout?.position ?? {}),
          col: currentCol,
          row: currentRow,
        },
      },
    }

    newTiles.push(newTile)
    currentCol += colSpan
    rowHeight = Math.max(rowHeight, rowSpan)
  }

  return newTiles
}

/**
 * Returns the configuration for a dashboard based on the provided configuration
 * and organization level advanced analytics status.
 *
 * @param config - The dashboard configuration.
 * @param advancedAnalyticsEnabled - Whether advanced analytics is enabled.
 */
export const configureAllowedDefinition = (
  config: DashboardConfig,
  advancedAnalyticsEnabled: boolean,
): DashboardConfig => {
  // Advanced tier: upgrade basic tiles to advanced
  if (advancedAnalyticsEnabled) {
    const processedTiles = config.tiles.map(processTileForAdvancedTier)

    return {
      ...config,
      tiles: processedTiles,
    }
  }

  // Basic tier: filter tiles and reposition
  const processedTiles = config.tiles
    .map(processTileForBasicTier)
    .filter((tile) => tile !== undefined)

  const repositionedTiles = repositionTiles(processedTiles)

  return {
    ...config,
    tiles: repositionedTiles,
  }
}
