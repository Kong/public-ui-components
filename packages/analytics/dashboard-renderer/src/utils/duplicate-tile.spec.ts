import { afterEach, expect, it, vi } from 'vitest'
import type { GridTile } from '../types'
import type { TileDefinition } from '@kong-ui-public/analytics-utilities'
import {
  duplicateChartTile,
  duplicateTableTile,
} from './duplicate-tile'

afterEach(() => {
  vi.restoreAllMocks()
})

it('duplicates table tiles with a copied title and reset position', () => {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('table-copy-id')
  const tile: GridTile<TileDefinition> = {
    id: 'table-tile',
    type: 'table',
    layout: {
      position: { col: 3, row: 4 },
      size: { cols: 4, rows: 3 },
    },
    meta: {
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['route'],
        filters: [],
      },
      config: {
        title: 'Routes',
      },
    },
  }

  expect(duplicateTableTile(tile)).toEqual({
    id: 'table-copy-id',
    type: 'table',
    definition: {
      query: tile.meta.query,
      config: {
        title: 'Copy of Routes',
      },
    },
    layout: {
      position: { col: 0, row: 0 },
      size: { cols: 4, rows: 3 },
    },
  })
})

it('duplicates chart tiles with a copied chart title and reset position', () => {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('chart-copy-id')
  const tile: GridTile<TileDefinition> = {
    id: 'chart-tile',
    type: 'chart',
    layout: {
      position: { col: 2, row: 1 },
      size: { cols: 3, rows: 2 },
    },
    meta: {
      query: {
        datasource: 'api_usage',
        metrics: ['request_count'],
        filters: [],
        dimensions: ['time'],
      },
      chart: {
        type: 'timeseries_line',
        chart_title: 'Requests',
      },
    },
  }

  expect(duplicateChartTile(tile)).toEqual({
    id: 'chart-copy-id',
    type: 'chart',
    definition: {
      query: tile.meta.query,
      chart: {
        type: 'timeseries_line',
        chart_title: 'Copy of Requests',
      },
    },
    layout: {
      position: { col: 0, row: 0 },
      size: { cols: 3, rows: 2 },
    },
  })
})

it('duplicates slottable chart tiles without prefixing a title', () => {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('slottable-copy-id')
  const tile: GridTile<TileDefinition> = {
    id: 'slottable-tile',
    type: 'chart',
    layout: {
      position: { col: 1, row: 2 },
      size: { cols: 6, rows: 4 },
    },
    meta: {
      query: {
        datasource: 'api_usage',
        metrics: ['request_count'],
        filters: [],
        dimensions: ['time'],
      },
      chart: {
        type: 'slottable',
        id: 'custom-slot',
      },
    },
  }

  expect(duplicateChartTile(tile)).toEqual({
    id: 'slottable-copy-id',
    type: 'chart',
    definition: {
      query: tile.meta.query,
      chart: {
        type: 'slottable',
        id: 'custom-slot',
      },
    },
    layout: {
      position: { col: 0, row: 0 },
      size: { cols: 6, rows: 4 },
    },
  })
})
