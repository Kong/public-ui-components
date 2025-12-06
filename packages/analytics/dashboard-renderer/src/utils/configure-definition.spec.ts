import { describe, it, expect } from 'vitest'
import { configureAllowedDefinition } from './configure-definition'
import type { DashboardConfig, TileConfig } from '@kong-ui-public/analytics-utilities'

describe('configureAllowedDefinition', () => {
  const mockBasicTile: TileConfig = {
    id: 'basic_tile_1',
    type: 'chart',
    layout: {
      size: { cols: 3, rows: 2 },
      position: { col: 0, row: 0 },
    },
    definition: {
      chart: { type: 'timeseries_line', chart_title: 'Basic Chart' },
      query: {
        filters: [],
        metrics: ['request_count'],
        datasource: 'basic',
        dimensions: ['time'],
      },
    },
  }

  const mockApiUsageTile: TileConfig = {
    id: 'api_usage_tile_1',
    type: 'chart',
    layout: {
      size: { cols: 3, rows: 2 },
      position: { col: 3, row: 0 },
    },
    definition: {
      chart: { type: 'horizontal_bar', chart_title: 'API Usage Chart' },
      query: {
        filters: [],
        metrics: ['kong_latency_average'],
        datasource: 'api_usage',
        dimensions: ['data_plane_node'],
      },
    },
  }

  const mockTileWithoutQuery: TileConfig = {
    id: 'no_query_tile',
    type: 'chart',
    layout: {
      size: { cols: 2, rows: 1 },
      position: { col: 0, row: 2 },
    },
    definition: ({
      chart: { type: 'gauge', chart_title: 'No Query Chart' },
    } as any),
  }

  describe('Advanced Analytics Enabled', () => {
    it('should convert all tiles to use api_usage datasource', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)

      expect(result.tiles).toHaveLength(1)
      expect(result.tiles[0].definition?.query?.datasource).toBe('api_usage')
    })

    it('should preserve all tile properties except datasource', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)
      const resultTile = result.tiles[0]

      expect(resultTile.id).toBe(mockBasicTile.id)
      expect(resultTile.type).toBe(mockBasicTile.type)
      expect(resultTile.layout).toEqual(mockBasicTile.layout)
      expect(resultTile.definition?.chart).toEqual(mockBasicTile.definition?.chart)
      expect(resultTile.definition?.query?.metrics).toEqual(mockBasicTile.definition?.query?.metrics)
      expect(resultTile.definition?.query?.dimensions).toEqual(mockBasicTile.definition?.query?.dimensions)
    })

    it('should handle tiles without queries', () => {
      const config: DashboardConfig = {
        tiles: [mockTileWithoutQuery],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)

      expect(result.tiles).toHaveLength(1)
      expect(result.tiles[0]).toEqual(mockTileWithoutQuery)
    })

    it('should convert multiple tiles with different datasources', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile, mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)

      expect(result.tiles).toHaveLength(2)
      expect(result.tiles[0].definition?.query?.datasource).toBe('api_usage')
      expect(result.tiles[1].definition?.query?.datasource).toBe('api_usage')
    })

    it('should maintain original tile positions', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile, mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)

      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
      expect(result.tiles[1].layout?.position).toEqual({ col: 3, row: 0 })
    })

    it('should preserve other config properties', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, true)

      expect(result.tile_height).toBe(167)
    })
  })

  describe('Basic Analytics (Advanced Disabled)', () => {
    it('should filter out api_usage datasource tiles', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile, mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(1)
      expect(result.tiles[0].id).toBe('basic_tile_1')
      expect(result.tiles[0].definition?.query?.datasource).toBe('basic')
    })

    it('should keep tiles without queries', () => {
      const config: DashboardConfig = {
        tiles: [mockTileWithoutQuery, mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(1)
      expect(result.tiles[0].id).toBe('no_query_tile')
    })

    it('should reposition tiles after filtering', () => {
      const tile1: TileConfig = {
        ...mockBasicTile,
        id: 'tile_1',
        layout: {
          size: { cols: 3, rows: 2 },
          position: { col: 0, row: 0 },
        },
      }

      const tile2: TileConfig = {
        ...mockApiUsageTile,
        id: 'tile_2',
        layout: {
          size: { cols: 3, rows: 2 },
          position: { col: 3, row: 0 },
        },
      }

      const tile3: TileConfig = {
        ...mockBasicTile,
        id: 'tile_3',
        layout: {
          size: { cols: 3, rows: 2 },
          position: { col: 0, row: 2 },
        },
        definition: {
          ...mockBasicTile.definition,
          query: ({
            ...mockBasicTile.definition?.query,
            datasource: 'basic',
          } as any),
        },
      }

      const config: DashboardConfig = {
        tiles: [tile1, tile2, tile3],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(2)
      // First tile should be at position (0, 0)
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
      // Second tile should be repositioned to (3, 0) since first tile takes 3 cols
      expect(result.tiles[1].layout?.position).toEqual({ col: 3, row: 0 })
    })

    it('should wrap tiles to next row when exceeding DASHBOARD_COLS', () => {
      const tile1: TileConfig = {
        ...mockBasicTile,
        id: 'tile_1',
        layout: {
          size: { cols: 4, rows: 2 },
          position: { col: 0, row: 0 },
        },
      }

      const tile2: TileConfig = {
        ...mockBasicTile,
        id: 'tile_2',
        layout: {
          size: { cols: 4, rows: 2 },
          position: { col: 4, row: 0 },
        },
      }

      const config: DashboardConfig = {
        tiles: [tile1, tile2],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(2)
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
      // Second tile should wrap to next row (assuming DASHBOARD_COLS is 6)
      expect(result.tiles[1].layout?.position).toEqual({ col: 0, row: 2 })
    })

    it('should handle varying tile heights correctly', () => {
      const tile1: TileConfig = {
        ...mockBasicTile,
        id: 'tile_1',
        layout: {
          size: { cols: 2, rows: 3 },
          position: { col: 0, row: 0 },
        },
      }

      const tile2: TileConfig = {
        ...mockBasicTile,
        id: 'tile_2',
        layout: {
          size: { cols: 2, rows: 1 },
          position: { col: 2, row: 0 },
        },
      }

      const tile3: TileConfig = {
        ...mockBasicTile,
        id: 'tile_3',
        layout: {
          size: { cols: 2, rows: 2 },
          position: { col: 4, row: 0 },
        },
      }

      const config: DashboardConfig = {
        tiles: [tile1, tile2, tile3],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(3)
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
      expect(result.tiles[1].layout?.position).toEqual({ col: 2, row: 0 })
      expect(result.tiles[2].layout?.position).toEqual({ col: 4, row: 0 })
    })

    it('should return empty tiles array when all tiles are filtered', () => {
      const config: DashboardConfig = {
        tiles: [mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(0)
    })

    it('should handle empty tiles array', () => {
      const config: DashboardConfig = {
        tiles: [],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle tiles with missing layout size properties', () => {
      const tileWithoutSize: TileConfig = {
        id: 'tile_no_size',
        type: 'chart',
        layout: ({
          position: { col: 0, row: 0 },
        } as any),
        definition: {
          chart: { type: 'gauge', chart_title: 'Test' },
          query: {
            filters: [],
            metrics: ['request_count'],
            datasource: 'basic',
            dimensions: [],
          },
        },
      }

      const config: DashboardConfig = {
        tiles: [tileWithoutSize],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(1)
      // Should default to 1 col and 1 row
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
    })

    it('should preserve tile layout size during repositioning', () => {
      const config: DashboardConfig = {
        tiles: [mockBasicTile, mockApiUsageTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles[0].layout?.size).toEqual({ cols: 3, rows: 2 })
    })

    it('should handle mixed datasources correctly in basic tier', () => {
      const customTile: TileConfig = {
        ...mockBasicTile,
        id: 'custom_tile',
        definition: {
          ...mockBasicTile.definition,
          query: {
            ...mockBasicTile.definition?.query,
            datasource: 'custom_datasource' as any,
          },
        },
      }

      const config: DashboardConfig = {
        tiles: [mockBasicTile, mockApiUsageTile, customTile],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(config, false)

      expect(result.tiles).toHaveLength(2)
      expect(result.tiles[0].definition?.query?.datasource).toBe('basic')
      expect(result.tiles[1].definition?.query?.datasource).toBe('custom_datasource')
    })
  })

  describe('Dashboard Example', () => {
    it('should correctly process dashboard for advanced tier', () => {
      const runtimeInstancesConfig: DashboardConfig = {
        tiles: [
          {
            id: 'chart_1',
            type: 'chart',
            layout: {
              size: { cols: 3, rows: 2 },
              position: { col: 0, row: 0 },
            },
            definition: {
              chart: { type: 'timeseries_line', chart_title: 'Total requests' },
              query: {
                filters: [],
                metrics: ['request_count'],
                datasource: 'basic',
                dimensions: ['data_plane_node', 'time'],
              },
            },
          },
          {
            id: 'chart_4',
            type: 'chart',
            layout: {
              size: { cols: 3, rows: 2 },
              position: { col: 0, row: 4 },
            },
            definition: {
              chart: { type: 'horizontal_bar', chart_title: 'Kong latency (avg)' },
              query: {
                filters: [],
                metrics: ['kong_latency_average'],
                datasource: 'api_usage',
                dimensions: ['data_plane_node'],
              },
            },
          },
        ],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(runtimeInstancesConfig, true)

      expect(result.tiles).toHaveLength(2)
      expect(result.tiles.every(tile => tile.definition?.query?.datasource === 'api_usage')).toBe(true)
      // Positions should remain unchanged in advanced tier
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
      expect(result.tiles[1].layout?.position).toEqual({ col: 0, row: 4 })
    })

    it('should correctly process dashboard for basic tier', () => {
      const runtimeInstancesConfig: DashboardConfig = {
        tiles: [
          {
            id: 'chart_1',
            type: 'chart',
            layout: {
              size: { cols: 3, rows: 2 },
              position: { col: 0, row: 0 },
            },
            definition: {
              chart: { type: 'timeseries_line', chart_title: 'Total requests' },
              query: {
                filters: [],
                metrics: ['request_count'],
                datasource: 'basic',
                dimensions: ['data_plane_node', 'time'],
              },
            },
          },
          {
            id: 'chart_4',
            type: 'chart',
            layout: {
              size: { cols: 3, rows: 2 },
              position: { col: 0, row: 4 },
            },
            definition: {
              chart: { type: 'horizontal_bar', chart_title: 'Kong latency (avg)' },
              query: {
                filters: [],
                metrics: ['kong_latency_average'],
                datasource: 'api_usage',
                dimensions: ['data_plane_node'],
              },
            },
          },
        ],
        tile_height: 167,
      }

      const result = configureAllowedDefinition(runtimeInstancesConfig, false)

      // Only the basic tile should remain
      expect(result.tiles).toHaveLength(1)
      expect(result.tiles[0].id).toBe('chart_1')
      expect(result.tiles[0].definition?.query?.datasource).toBe('basic')
      // Should be repositioned to (0, 0)
      expect(result.tiles[0].layout?.position).toEqual({ col: 0, row: 0 })
    })
  })
})
