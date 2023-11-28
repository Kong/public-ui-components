import type { TileLayout } from './dashboard-renderer-types'

export interface TilePosition {
  col: number,
  row: number,
}

export interface TileSize {
  rows: number,
  cols: number,
}

export interface GridTile {
  id: string,
  layout: TileLayout
}

export interface GridSize {
  rows: number,
  cols: number,
}
export interface Cell {
  key: string
  tile: GridTile
  style: {
    width: string,
    height: string,
    transform: string,
  }
}
