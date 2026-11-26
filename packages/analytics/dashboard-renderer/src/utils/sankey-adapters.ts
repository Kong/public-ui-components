import type { AnalyticsExploreRecord, ColorCoordinator, Display, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { SankeyLink, SankeyNode } from '@kong-ui-public/echarts'

import { NON_ADDITIVE_METRIC } from '@kong-ui-public/analytics-utilities'
import { color } from '@kong-ui-public/analytics-utilities/coordination'
import { OTHER_DIMENSION_ID } from '@kong-ui-public/analytics-chart'
import { toMetricValue } from './metric-value'

/** Top N in each column when the query has no `limit` */
export const SANKEY_DEFAULT_LIMIT = 5

/**
 * Rows fetched for a sankey: the API's maximum. The API's `limit` picks the top values
 * of each dimension overall, not per node, so the sankey fetches every combination it
 * can and picks the top values of each node itself.
 */
export const SANKEY_QUERY_LIMIT = 1000

export interface SankeyAdapterOptions {
  /** How many nodes to keep in each column, see `exploreResultToSankey` */
  limit?: number
  /** The dashboard's color coordinator, so a value gets the same color as in the dashboard's other charts */
  coordinator?: ColorCoordinator
  /** The chart requesting the colors, so the coordinator keeps its neighboring nodes apart */
  chartUuid?: string
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

/** Whether a sankey can be built from this metric and these dimensions */
export const isSankeyCompatible = (metric: string | undefined, dimensions: string[]): boolean => {
  // Node values are sums of their links, so the metric must add up across dimension values
  return [2, 3].includes(dimensions.length) && !dimensions.includes('time') && (!metric || !NON_ADDITIVE_METRIC.test(metric))
}

const isOtherGroup = (dimensionDisplay: Display | undefined, id: string): boolean => {
  return id === OTHER_DIMENSION_ID || !!dimensionDisplay?.[id]?.is_other_group
}

interface NodeSource {
  dimension: string
  /** The dimension value */
  id: string
  depth: number
  /** The full total, for the tooltip */
  total?: number
}

// Prefixed with the dimension, so the same value in two columns stays two nodes
const nodeId = (dimension: string, id: string): string => `${dimension}:${id}`

/** A first-column value's color, which every flow through it takes on */
const rankedColor = (
  dimension: string,
  id: string,
  order: number,
  { coordinator, chartUuid }: SankeyAdapterOptions,
): string => (
  // Like the analytics charts: the coordinator keeps a value's color across the dashboard, and
  // without one each value takes the next palette color, so neighbors don't share a color
  color({
    ...(!coordinator && { discriminator: order }),
    dimension,
    dimensionValue: id,
    coordinator,
    order,
    chartUuid,
  })
)

type NodeColor = NonNullable<NonNullable<SankeyNode['itemStyle']>['color']>

/**
 * A later node's fill: the colors of the links arriving at it, stacked in hard-edged segments
 * in the order they land (their sources' order down the previous column), or one solid color.
 */
const stackedColor = (incoming: SankeyLink[], fallback: string): NodeColor => {
  const colors = incoming.map(({ lineStyle }) => String(lineStyle?.color ?? fallback))

  if (new Set(colors).size <= 1) {
    return colors[0] ?? fallback
  }

  const total = incoming.reduce((sum, { value }) => sum + value, 0)
  let offset = 0

  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: incoming.flatMap(({ value }, index) => {
      const from = offset / total

      offset += value

      return [{ offset: from, color: colors[index] }, { offset: offset / total, color: colors[index] }]
    }),
  }
}

/** The `limit` largest entries, largest first */
const topEntries = (values: Map<string, number>, limit = Infinity): Array<[string, number]> => {
  return [...values.entries()].sort(([, a], [, b]) => b - a).slice(0, limit)
}

/** Adds `value` to the entry at `key`, starting from zero */
const addTo = <K>(values: Map<K, number>, key: K, value: number): void => {
  values.set(key, (values.get(key) ?? 0) + value)
}

/** Adds `value` to the entry at `key` within the nested map at `group` */
const addToGroup = (groups: Map<string, Map<string, number>>, group: string, key: string, value: number): void => {
  const values = groups.get(group) ?? new Map<string, number>()
  addTo(values, key, value)
  groups.set(group, values)
}

/**
 * Reduces an explore result with two or three dimensions to sankey nodes and links, sized by the first metric.
 * Each dimension is a column, in query order.
 *
 * The first dimension is ranked: the chart keeps its top `limit` values by total. Every other column
 * breaks them down into each one's own top `limit` values, through the values picked for it in the
 * columns before, so every value shown has a link. A value shared by several of them appears once,
 * e.g. provider -> its top models -> their top users. Links only count traffic through the ranked
 * values shown and the values picked for them.
 *
 * The API's `Other` groups are left out. First-column nodes are as tall as their links, in ranked order,
 * and carry their full total for the tooltip, since their links only cover part of it.
 *
 * Each first-column value has a color. A link takes the color of the first-column value that sends the
 * most through it, so a color runs from the first column to the last, and later nodes stack the colors
 * of the links arriving at them.
 */
export const exploreResultToSankey = (
  result: ExploreResultV4 | undefined,
  { limit = SANKEY_DEFAULT_LIMIT, ...colorOptions }: SankeyAdapterOptions = {},
): SankeyData | undefined => {
  if (!result?.meta || !result.data) {
    return undefined
  }

  const { display, metric_names: metricNames } = result.meta
  const metric = metricNames?.[0]
  // `display` is keyed by the query's dimensions in query order
  const dimensions = display ? Object.keys(display) : []

  if (!metric || !isSankeyCompatible(metric, dimensions)) {
    console.error('Cannot build sankey chart data from this explore result. Needs an additive metric and two or three dimensions, none of them time.')

    return undefined
  }

  const [rankedDimension, ...otherDimensions] = dimensions

  const otherDimension = dimensions.find((dimension) => Object.keys(display[dimension] ?? {}).some((id) => isOtherGroup(display[dimension], id)))

  if (otherDimension) {
    console.warn(`The sankey query returned an Other group for "${otherDimension}", so some nodes' top values may be missing.`)
  }

  const records: Array<{ ids: Record<string, string>, value: number }> = []
  const rankedTotals = new Map<string, number>()

  for (const { event } of result.data as AnalyticsExploreRecord[]) {
    const value = toMetricValue(event[metric])
    const ids = Object.fromEntries(dimensions.map((dimension) => [dimension, String(event[dimension])]))
    const rankedId = ids[rankedDimension]

    if (value === undefined || isOtherGroup(display[rankedDimension], rankedId)) {
      continue
    }

    records.push({ ids, value })
    // The total counts every value around the ranked value, including Other groups and values past the top N
    addTo(rankedTotals, rankedId, value)
  }

  const rankedEntries = topEntries(rankedTotals, limit)
  const rankedIds = new Set(rankedEntries.map(([id]) => id))

  // Per other dimension, per ranked value: the values picked for it
  const picked = new Map(otherDimensions.map((dimension) => [dimension, new Map<string, Set<string>>()]))
  // Per dimension, the values shown, in the order they were picked
  const shown = new Map<string, Set<string>>([[rankedDimension, rankedIds]])

  const isPicked = (dimension: string, ids: Record<string, string>): boolean => (
    dimension === rankedDimension || !!picked.get(dimension)?.get(ids[rankedDimension])?.has(ids[dimension])
  )

  for (const [index, dimension] of otherDimensions.entries()) {
    const columnValues = new Set<string>()
    // Per ranked value: its flow to each of this column's values, only through the values picked
    // for it in the columns before, so each value picked here has a link to it
    const flows = new Map<string, Map<string, number>>()

    for (const { ids, value } of records) {
      if (!isOtherGroup(display[dimension], ids[dimension]) && otherDimensions.slice(0, index).every((previous) => isPicked(previous, ids))) {
        addToGroup(flows, ids[rankedDimension], ids[dimension], value)
      }
    }

    for (const [rankedId] of rankedEntries) {
      const top = topEntries(flows.get(rankedId) ?? new Map(), limit).map(([id]) => id)

      picked.get(dimension)!.set(rankedId, new Set(top))
      top.forEach((id) => columnValues.add(id))
    }

    shown.set(dimension, columnValues)
  }

  const colors = new Map(rankedEntries.map(([id], order) => [id, rankedColor(rankedDimension, id, order, colorOptions)]))
  const links: SankeyLink[] = []

  // Links between each pair of neighboring columns
  for (const [index, source] of dimensions.slice(0, -1).entries()) {
    const target = dimensions[index + 1]
    const pairFlows = new Map<string, Map<string, number>>()
    // Per link, the flow from each first-column value through it
    const pairLeads = new Map<string, Map<string, number>>()

    for (const { ids, value } of records) {
      if (rankedIds.has(ids[rankedDimension]) && isPicked(source, ids) && isPicked(target, ids)) {
        addToGroup(pairFlows, ids[source], ids[target], value)
        addToGroup(pairLeads, JSON.stringify([ids[source], ids[target]]), ids[rankedDimension], value)
      }
    }

    for (const sourceId of shown.get(source)!) {
      for (const [targetId, value] of topEntries(pairFlows.get(sourceId) ?? new Map())) {
        const [[lead]] = topEntries(pairLeads.get(JSON.stringify([sourceId, targetId]))!, 1)

        links.push({ source: nodeId(source, sourceId), target: nodeId(target, targetId), value, lineStyle: { color: colors.get(lead) } })
      }
    }
  }

  const nodeSources: NodeSource[] = [
    ...rankedEntries.map(([id, total]) => ({ dimension: rankedDimension, id, depth: 0, total })),
    ...otherDimensions.flatMap((dimension) => [...shown.get(dimension)!].map((id) => ({ dimension, id, depth: dimensions.indexOf(dimension) }))),
  ]

  const nodeIds = nodeSources.map(({ dimension, id }) => nodeId(dimension, id))
  // For a node no link arrives at
  const fallback = colors.get(rankedEntries[0]?.[0])!

  const nodes = nodeSources.map(({ dimension, id, depth, total }, index): SankeyNode => {
    const incoming = links
      .filter(({ target }) => target === nodeIds[index])
      .sort((a, b) => nodeIds.indexOf(a.source) - nodeIds.indexOf(b.source))

    return {
      id: nodeIds[index],
      name: display[dimension]?.[id]?.name ?? id,
      depth,
      ...(total !== undefined && { total }),
      itemStyle: { color: depth === 0 ? colors.get(id)! : stackedColor(incoming, fallback) },
    }
  })

  return { nodes, links }
}
