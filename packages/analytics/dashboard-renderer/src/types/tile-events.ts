import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'

export interface TileZoomEvent {
  tileId: string
  timeRange: AbsoluteTimeRangeV4
}

export interface TileBoundsChangeEvent {
  tileId: string
  bounds: Array<[number, number]>
}

