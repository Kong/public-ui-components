import { type Ref } from 'vue'

export type InteractionCoordinatorActivateProps = {
  chartUuid: string | null
  timestamp?: number | null
  dimension?: string | null
  dimensionValue?: string | null
  metric?: string | null
}

export type InteractionCoordinatorDeactivateProps = {
  chartUuid: string
}

export type ColorCoordinatorResolveArgs = {
  /**
   * The consistent series string (e.g. the concatenated dimension/value/metric).
   * Colors are keyed by this value, so the same string always resolves to the
   * same palette index across every chart in the dashboard.
   */
  name: string
  /**
   * This series' rank within its chart (e.g. 1 for the highest value).
   */
  order?: number
  /**
   * The uuid of the chart requesting the color. Used to group a chart's series
   * when avoiding adjacent collisions, so interleaving between charts cannot
   * cause false adjacency.
   */
  chartUuid?: string
  /**
   * The active color theme. Must match the theme the chart will ultimately pass
   * to `color()` so the assigned indices resolve to the intended palette.
   */
  theme?: 'light' | 'dark'
  customPalette?: string[]
}

/**
 * Coordinates series colors across the charts of a single context (usually a
 * dashboard).
 *
 * This is intentionally NOT reactive: a chart resolves each series color once,
 * synchronously, at render time and then freezes it. Assignments are append-only
 * and locked per series string, which guarantees that the same series string
 * always resolves to the same color across every chart within the same context
 *
 * Charts do not call this directly; they pass the coordinator (and `order`/
 * `chartUuid`) to `color()`, which delegates for generic series.
 */
export type ColorCoordinator = {
  /**
   * Resolve a single generic series string to a palette index, assigning and
   * locking it on first use. Honors `order`/`chartUuid` to keep adjacent series
   * within a chart distinct when possible, and spreads colors across the palette.
   */
  resolveDiscriminator: (args: ColorCoordinatorResolveArgs) => number
  /**
   * Clear all color assignments. Call when the underlying series are invalidated
   * (e.g. a dashboard-level filter or time-range change).
   */
  reset: () => void
}

export type InteractionCoordinator = {
  /**
   * Call `activate` whenever the user performs an action that selects or highlights
   * a specific chart, timestamp, dimension, and/or dimension value.
   */
  activate: (args: InteractionCoordinatorActivateProps) => void
  /**
   * The uuid of the last chart that called `activate`
   */
  activeChart: Readonly<Ref<string | null>>
  /**
   * The dimension name that was most recently activated. Use the canonical
   * name of the dimension, not the display string (e.g. 'control_plane' NOT
   * 'Control plane')
   */
  activeDimension: Readonly<Ref<string | null>>
  /**
   * The dimension value that was most recently activated. Use the canonical
   * name of the value, not the display string (e.g. 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219'
   * NOT 'default')
   */
  activeDimensionValue: Readonly<Ref<string | null>>
  /**
   * The metric name that was most recently activated. Use the canonical name
   * of the metric, not the display string (e.g. 'request_count' NOT 'Request count')
   */
  activeMetric: Readonly<Ref<string | null>>
  /**
   * The timestamp that was most recently activated. Use the numeric representation.
   */
  activeTimestamp: Readonly<Ref<number | null>>
  /**
   * Call `deactivate` whenever the user leaves the context of the current chart,
   * usually a `mouseout` event.
   */
  deactivate: (args: InteractionCoordinatorDeactivateProps) => void
  /**
   * The number of milliseconds you should wait between `activate` calls that
   * include a `dimension` or `dimensionValue`
   */
  DIMENSION_DEBOUNCE_MS: number
  /**
   * The number of milliseconds you should wait between `activate` calls that
   * include a `metric`
   */
  METRIC_DEBOUNCE_MS: number
  /**
   * The number of milliseconds you should wait between `activate` calls that
   * only include a `timestamp`.
   */
  TIMESTAMP_DEBOUNCE_MS: number
  /**
   * Cross-chart series color coordination for the dashboard. This is a distinct,
   * non-reactive concern from the interaction state above.
   */
  color: ColorCoordinator
}
