import { describe, it, expect } from 'vitest'
import type { DashboardConfig, TileConfig } from '@kong-ui-public/analytics-utilities'
import { migrateLegacyColumns } from './migrate-legacy-columns'

const tile = (id: string, col: number, row: number, cols: number, rows = 2): TileConfig => ({
  id,
  type: 'slottable',
  layout: {
    position: { col, row },
    size: { cols, rows },
  },
})

describe('migrateLegacyColumns', () => {
  it('doubles positions and widths when columns is unset', () => {
    const config: DashboardConfig = {
      tiles: [tile('a', 0, 0, 3), tile('b', 3, 0, 3)],
      tile_height: 167,
    }

    const result = migrateLegacyColumns(config)

    expect(result.columns).toBe(12)
    expect(result.tile_height).toBe(167)
    expect(result.tiles.map(t => t.layout)).toEqual([
      { position: { col: 0, row: 0 }, size: { cols: 6, rows: 2 } },
      { position: { col: 6, row: 0 }, size: { cols: 6, rows: 2 } },
    ])
  })

  it('keeps proportions for rows that do not span the full width', () => {
    const config: DashboardConfig = {
      tiles: [tile('a', 0, 0, 2), tile('b', 4, 0, 1, 1)],
    }

    const result = migrateLegacyColumns(config)

    expect(result.tiles.map(t => t.layout)).toEqual([
      { position: { col: 0, row: 0 }, size: { cols: 4, rows: 2 } },
      { position: { col: 8, row: 0 }, size: { cols: 2, rows: 1 } },
    ])
  })

  it('preserves fit_to_content and leaves rows untouched', () => {
    const config: DashboardConfig = {
      tiles: [{
        ...tile('a', 1, 3, 2, 1),
        layout: { position: { col: 1, row: 3 }, size: { cols: 2, rows: 1, fit_to_content: true } },
      }],
    }

    const result = migrateLegacyColumns(config)

    expect(result.tiles[0].layout).toEqual({
      position: { col: 2, row: 3 },
      size: { cols: 4, rows: 1, fit_to_content: true },
    })
  })

  it('returns configs that declare columns untouched', () => {
    const config: DashboardConfig = {
      tiles: [tile('a', 0, 0, 6)],
      columns: 12,
    }

    expect(migrateLegacyColumns(config)).toBe(config)
  })

  it('is idempotent', () => {
    const config: DashboardConfig = {
      tiles: [tile('a', 0, 0, 3), tile('b', 3, 0, 3)],
    }

    const once = migrateLegacyColumns(config)

    expect(migrateLegacyColumns(once)).toEqual(once)
  })

  it('does not mutate the input', () => {
    const config: DashboardConfig = {
      tiles: [tile('a', 1, 0, 2)],
    }
    const snapshot = structuredClone(config)

    migrateLegacyColumns(config)

    expect(config).toEqual(snapshot)
  })

  it('handles an empty dashboard', () => {
    expect(migrateLegacyColumns({ tiles: [] })).toEqual({ tiles: [], columns: 12 })
  })
})
