import type { AnalyticsExploreRecord, Display, ExploreResultV4, RecordEvent } from '@kong-ui-public/analytics-utilities'
import type { TreeMapDataNode } from '@kong-ui-public/echarts'

import { color } from '@kong-ui-public/analytics-utilities/coordination'
import { toMetricValue } from './metric-value'
import { OTHER_DIMENSION_ID } from '@kong-ui-public/analytics-chart'

interface Branch {
  node: TreeMapDataNode
  children: Map<string, TreeMapDataNode>
}

export interface TreemapAdapterOptions {
  otherLabel?: string
}

const namedNode = (dimensionDisplay: Display | undefined, id: string, { otherLabel }: TreemapAdapterOptions): TreeMapDataNode => ({
  name: (id === OTHER_DIMENSION_ID && otherLabel) || (dimensionDisplay?.[id]?.name ?? id),
})

const groupNode = (dimension: string, dimensionDisplay: Display | undefined, id: string, options: TreemapAdapterOptions): TreeMapDataNode => ({
  ...namedNode(dimensionDisplay, id, options),
  itemStyle: { color: color({ dimension, dimensionValue: id }) },
})

const getOrCreate = <T>(entries: Map<string, T>, id: string, create: () => T): T => {
  const entry = entries.get(id) ?? create()
  entries.set(id, entry)

  return entry
}

// Treemap areas are parts of a whole, so the metric has to add up across groups.
// Averages, percentiles, rates, maximums and per-minute values are not valid
const NON_ADDITIVE_METRIC = /_(average|p\d+|rate|max|per_minute)$/

/** Whether a treemap can be sized by this metric and grouped by these dimensions */
export const isTreemapCompatible = (metric: string | undefined, dimensions: string[]): boolean => {
  return !dimensions.includes('time') && !(metric && NON_ADDITIVE_METRIC.test(metric))
}

// Sums values when a dimension value spans several records
const addValue = (node: TreeMapDataNode, value: number): void => {
  node.value = Number(node.value ?? 0) + value
}

/** Groups records by the first dimension and nests a second dimension value under each group */
const buildBranches = (
  records: AnalyticsExploreRecord[],
  metric: string,
  display: Record<string, Display>,
  [groupDimension, childDimension]: string[],
  options: TreemapAdapterOptions,
): Map<string, Branch> => {
  const branches = new Map<string, Branch>()
  const dimensionKey = (event: RecordEvent, dimension: string): string => String(event[dimension])

  for (const { event } of records) {
    const value = toMetricValue(event[metric])

    if (value === undefined) {
      continue
    }

    const groupId = dimensionKey(event, groupDimension)
    const branch = getOrCreate(branches, groupId, () => (
      {
        node: groupNode(groupDimension, display[groupDimension], groupId, options),
        children: new Map(),
      }),
    )

    if (!childDimension) {
      addValue(branch.node, value)
      continue
    }

    const childId = dimensionKey(event, childDimension)
    const childNode = getOrCreate(branch.children, childId, () => namedNode(display[childDimension], childId, options))
    addValue(childNode, value)
  }

  return branches
}

/**
 * Reduces an explore result to treemap nodes sized by the first metric.
 *
 * With one dimension each value is a flat node. With two the first dimension
 * groups the second, e.g. provider -> model
 */
export const exploreResultToTreemap = (
  result: ExploreResultV4 | undefined,
  options: TreemapAdapterOptions = {},
): TreeMapDataNode[] | undefined => {
  if (!result?.meta || !result.data) {
    return undefined
  }

  const { display, metric_names: metricNames } = result.meta
  const metric = metricNames?.[0]
  // `display` is keyed by the query's dimensions in query order
  const dimensions = display ? Object.keys(display) : []

  if (!metric || !dimensions.length) {
    console.error('Cannot build treemap chart data from this explore result. Missing metric or dimension.')

    return undefined
  }

  if (!isTreemapCompatible(metric, dimensions)) {
    console.error('Cannot build treemap chart data from this explore result. Needs an additive metric and no time dimension.')

    return undefined
  }

  const branches = buildBranches(result.data as AnalyticsExploreRecord[], metric, display, dimensions, options)

  return [...branches.values()].map(({ node, children }) => (children.size ? { ...node, children: [...children.values()] } : node))
}
