import type { TileLayout } from './dashboard-renderer-types'

export interface TilePosition {
  col: number,
  row: number,
}

export interface TileSize {
  rows: number,
  cols: number,
}

export interface GridTile<T> {
  id: string | number,
  layout: TileLayout,
  meta: T,
}

export interface GridSize {
  rows: number,
  cols: number,
}
export interface Cell<T> {
  key: string
  tile: GridTile<T>
  style: {
    'grid-column-start': number
    'grid-column-end': number
    'grid-row-start': number
    'grid-row-end': number
  }
}
