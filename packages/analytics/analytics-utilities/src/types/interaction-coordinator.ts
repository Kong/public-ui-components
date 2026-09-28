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
}
