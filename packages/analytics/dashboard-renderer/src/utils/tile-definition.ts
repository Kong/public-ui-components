import type {
  TableChartTileDefinition,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

export const isTableChartDefinition = (
  definition: TileDefinition | undefined,
): definition is TableChartTileDefinition => {
  return definition?.chart.type === 'table'
}
