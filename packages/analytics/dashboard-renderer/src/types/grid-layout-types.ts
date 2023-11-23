export interface TilePosition {
  col: number,
  row: number,
}

export interface TileSize {
  rows: number,
  cols: number,
}

export interface Tile {
  id: string,
  position: TilePosition,
  size: TileSize,
}

export interface GridSize {
  rows: number,
  cols: number,
}
