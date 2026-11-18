import type { AnalyticsExploreRecord, Display, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { SankeyLink, SankeyNode } from '@kong-ui-public/echarts'

import { NON_ADDITIVE_METRIC } from '@kong-ui-public/analytics-utilities'
import { color } from '@kong-ui-public/analytics-utilities/coordination'
import { OTHER_DIMENSION_ID } from '@kong-ui-public/analytics-chart'
import { toMetricValue } from './metric-value'

/** Top N in each column when the query has no `limit` */
export const SANKEY_DEFAULT_LIMIT = 5

/**
 * Rows fetched for a sankey: the API's maximum. The API's `limit` picks the top values
 * of each dimension overall, not per first-dimension value, so the sankey fetches every
 * pair it can and picks the top values of each node itself.
 */
export const SANKEY_QUERY_LIMIT = 1000

export interface SankeyAdapterOptions {
  /** How many nodes to keep: the top N first-dimension values, and the top N second-dimension values of each */
  limit?: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

/** Whether a sankey can be built from this metric and these dimensions */
export const isSankeyCompatible = (metric: string | undefined, dimensions: string[]): boolean => {
  // Node values are sums of their links, so the metric must add up across dimension values
  return dimensions.length === 2 && !dimensions.includes('time') && (!metric || !NON_ADDITIVE_METRIC.test(metric))
}

const isOtherGroup = (dimensionDisplay: Display | undefined, id: string): boolean => {
  return id === OTHER_DIMENSION_ID || !!dimensionDisplay?.[id]?.is_other_group
}

const sankeyNode = (dimension: string, dimensionDisplay: Display | undefined, id: string, depth: number): SankeyNode => ({
  // Prefixed with the dimension, so the same value in both columns stays two nodes
  id: `${dimension}:${id}`,
  name: dimensionDisplay?.[id]?.name ?? id,
  depth,
  itemStyle: { color: color({ dimension, dimensionValue: id }) },
})

/** The `limit` largest entries, largest first */
const topEntries = (values: Map<string, number>, limit: number): Array<[string, number]> => {
  return [...values.entries()].sort(([, a], [, b]) => b - a).slice(0, limit)
}

/**
 * Reduces an explore result with two dimensions to sankey nodes and links, sized by the first metric.
 *
 * Keeps the top `limit` values of the first dimension, and links each to its own top `limit`
 * values of the second dimension, so a second-dimension value shared by several first-dimension
 * values appears once. The API's `Other` groups are left out. First-dimension nodes are sized by
 * their full total, so they keep their ranking even though their links only cover their top values.
 */
export const exploreResultToSankey = (
  result: ExploreResultV4 | undefined,
  { limit = SANKEY_DEFAULT_LIMIT }: SankeyAdapterOptions = {},
): SankeyData | undefined => {
  if (!result?.meta || !result.data) {
    return undefined
  }

  const { display, metric_names: metricNames } = result.meta
  const metric = metricNames?.[0]
  // `display` is keyed by the query's dimensions in query order
  const dimensions = display ? Object.keys(display) : []

  if (!metric || !isSankeyCompatible(metric, dimensions)) {
    console.error('Cannot build sankey chart data from this explore result. Needs an additive metric and two dimensions, neither of them time.')

    return undefined
  }

  const [sourceDimension, targetDimension] = dimensions

  if (Object.keys(display[targetDimension] ?? {}).some((id) => isOtherGroup(display[targetDimension], id))) {
    console.warn(`The sankey query returned an Other group for "${targetDimension}", so some nodes' top values may be missing.`)
  }

  const sourceTotals = new Map<string, number>()
  const targetValues = new Map<string, Map<string, number>>()

  for (const { event } of result.data as AnalyticsExploreRecord[]) {
    const value = toMetricValue(event[metric])
    const sourceId = String(event[sourceDimension])
    const targetId = String(event[targetDimension])

    if (value === undefined || isOtherGroup(display[sourceDimension], sourceId)) {
      continue
    }

    // The total counts every target, including the Other group and targets past the top N
    sourceTotals.set(sourceId, (sourceTotals.get(sourceId) ?? 0) + value)

    if (isOtherGroup(display[targetDimension], targetId)) {
      continue
    }

    const targets = targetValues.get(sourceId) ?? new Map<string, number>()
    targets.set(targetId, (targets.get(targetId) ?? 0) + value)
    targetValues.set(sourceId, targets)
  }

  const sourceNodes: SankeyNode[] = []
  const targetNodes = new Map<string, SankeyNode>()
  const links: SankeyLink[] = []

  for (const [sourceId, total] of topEntries(sourceTotals, limit)) {
    const source = { ...sankeyNode(sourceDimension, display[sourceDimension], sourceId, 0), value: total }
    sourceNodes.push(source)

    for (const [targetId, value] of topEntries(targetValues.get(sourceId) ?? new Map(), limit)) {
      const target = targetNodes.get(targetId) ?? sankeyNode(targetDimension, display[targetDimension], targetId, 1)
      targetNodes.set(targetId, target)
      links.push({ source: source.id, target: target.id, value })
    }
  }

  return { nodes: [...sourceNodes, ...targetNodes.values()], links }
}
