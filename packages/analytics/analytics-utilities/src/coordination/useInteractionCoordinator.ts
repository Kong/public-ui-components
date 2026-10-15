import { readonly, ref } from 'vue'
import useColorCoordinator from './useColorCoordinator'
import type {
  InteractionCoordinator,
  InteractionCoordinatorActivateProps,
  InteractionCoordinatorDeactivateProps,
} from '../types'

/**
 * The interaction coordinator is used for
 *
 * * reporting any interaction between a user and a chart so that other charts
 *     can react to it
 * * coordinating multiple charts to use the same colors while minimizing
 *     sequential series with the same color
 *
 * Use one instance of the coordinator for each logical grouping of charts. So,
 * dashboards use `provide`/`inject` to provide an instance of this coordinator
 * to each of its charts. Each of those charts then calls the color util with
 * that instance.
 *
 * Within each chart component we `watch` the things that we want the component
 * to react to (e.g. `watch(coordinatorInstance.activeDimension, (dim) =>
 * highlight(dim)`). Also each of those chart components call `activate` when
 * the user interacts with them.
 *
 * For performance concerns, please try to respect the `<foo>_DEBOUNCE_MS` constants
 * so that we're only firing certain kinds of interaction (and thereby triggering
 * redraws and updates) no more frequently than those constants suggest.
 */
export default function useInteractionCoordinator(): InteractionCoordinator {
  const activeChart = ref<string | null>(null)
  const activeTimestamp = ref<number | null>(null)
  const activeDimension = ref<string | null>(null)
  const activeDimensionValue = ref<string | null>(null)
  const activeMetric = ref<string | null>(null)
  const DIMENSION_DEBOUNCE_MS = 300
  const METRIC_DEBOUNCE_MS = 300
  const TIMESTAMP_DEBOUNCE_MS = 10

  const color = useColorCoordinator()

  const activate = ({
    chartUuid,
    timestamp = null,
    dimension = null,
    dimensionValue = null,
    metric = null,
  }: InteractionCoordinatorActivateProps) => {
    activeChart.value = chartUuid
    activeTimestamp.value = timestamp
    activeDimension.value = dimension
    activeDimensionValue.value = dimensionValue
    activeMetric.value = metric
  }

  const deactivate = ({
    chartUuid,
  }: InteractionCoordinatorDeactivateProps) => {
    if (activeChart.value === chartUuid) {
      activeChart.value = null
      activeTimestamp.value = null
      activeDimension.value = null
      activeDimensionValue.value = null
      activeMetric.value = null
    }
  }

  return {
    activate,
    activeChart: readonly(activeChart),
    activeDimension: readonly(activeDimension),
    activeDimensionValue: readonly(activeDimensionValue),
    activeMetric: readonly(activeMetric),
    activeTimestamp: readonly(activeTimestamp),
    deactivate,
    DIMENSION_DEBOUNCE_MS,
    METRIC_DEBOUNCE_MS,
    TIMESTAMP_DEBOUNCE_MS,
    color,
  }
}