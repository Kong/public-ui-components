import type {
  ChartTileDefinition,
  ScatterTileDefinition,
  TableChartTileDefinition,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'
import { TIMEFRAME_TOKEN } from '../constants'

export const isTableChartDefinition = (
  definition: TileDefinition | undefined,
): definition is TableChartTileDefinition => {
  return definition?.chart.type === 'table'
}

export const isRequestsChartDefinition = (
  definition: TileDefinition | undefined,
): definition is ScatterTileDefinition => {
  return definition?.query?.datasource === 'requests'
}

export const isExploreChartDefinition = (
  definition: TileDefinition | undefined,
): definition is ChartTileDefinition => {
  return !!definition && !isTableChartDefinition(definition) && !isRequestsChartDefinition(definition)
}

export const tileDescription = (
  definition: TileDefinition,
  timeframeLabel: string,
): string | undefined => {
  // TODO: remove the definition.chart.description fallback once we're done supporting it.
  const raw = definition.header_description ?? ('description' in definition.chart ? definition.chart.description : undefined)

  if (!raw) {
    return undefined
  }

  return raw.replaceAll(TIMEFRAME_TOKEN, timeframeLabel) || undefined
}
