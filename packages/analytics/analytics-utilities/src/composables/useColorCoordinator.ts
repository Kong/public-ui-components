import { lightPalette, darkPalette } from '../utils/color'
import type {
  ColorCoordinator,
  ColorCoordinatorResolveArgs,
} from '../types'

const DEFAULT_CHART_KEY = '__no_chart__'

/**
 * Coordinates series colors across multiple charts
 *
 * Intended to be composed privately by `useInteractionCoordinator` and exposed
 * under its `color` namespace. State here is deliberately plain (non-reactive):
 * charts resolve each color once at render time and freeze it.
 *
 * The algorithm is incremental, append-only, and locked-on-first-assignment:
 *  - A series string is keyed by its value, so the same string always resolves
 *    to the same palette index across every chart (consistency).
 *  - When a newly seen string is resolved, it is given the least-used palette
 *    index, avoiding the color of the immediately preceding series of the same
 *    chart (adjacency), then locked.
 *  - Because the palette has several colors and we only ever forbid one neighbor,
 *    a newly assigned string can always avoid colliding with the previous series.
 *    The only adjacent collisions that can occur are those inherited from strings
 *    already locked by an earlier-loading chart.
 */
export default function useColorCoordinator(): ColorCoordinator {
  // Series string -> locked palette index. Keyed by string => same string, same
  // color everywhere in the dashboard.
  const assignments = new Map<string, number>()
  // Palette index -> number of strings assigned to it, used for global spread.
  const usage = new Map<number, number>()
  // Per-chart tracker of the most recent resolve, so we can avoid giving the
  // next series in the same chart the same color as the previous one.
  const recent = new Map<string, { order: number | null, index: number }>()

  const bump = (index: number) => {
    usage.set(index, (usage.get(index) ?? 0) + 1)
  }

  // Pick the least-used palette index that is not in `forbidden`. Ties break to
  // the lowest index for determinism. If `forbidden` somehow covers the entire
  // palette (e.g. a tiny custom palette), neighbor avoidance is dropped.
  const pickIndex = (paletteLength: number, forbidden: Set<number>): number => {
    let best = -1
    let bestCount = Infinity

    for (let index = 0; index < paletteLength; index++) {
      if (forbidden.has(index)) {
        continue
      }
      const count = usage.get(index) ?? 0
      if (count < bestCount) {
        best = index
        bestCount = count
      }
    }

    if (best !== -1) {
      return best
    }

    return pickIndex(paletteLength, new Set())
  }

  const resolveDiscriminator = ({
    name,
    order,
    chartUuid,
    theme,
    customPalette,
  }: ColorCoordinatorResolveArgs): number => {
    const chartKey = chartUuid ?? DEFAULT_CHART_KEY
    const normalizedOrder = order ?? null
    const palette = customPalette ?? theme === 'light' ? lightPalette : darkPalette

    let index: number
    if (assignments.has(name)) {
      // Already locked => consistency across charts.
      index = assignments.get(name)!
    } else {
      const forbidden = new Set<number>()
      const previous = recent.get(chartKey)
      // Only treat the previous resolve as an adjacent neighbor when it is the
      // directly preceding series of the same chart.
      if (
        normalizedOrder !== null
        && previous?.order !== null
        && previous?.order !== undefined
        && normalizedOrder === previous.order + 1
      ) {
        forbidden.add(previous.index)
      }

      const paletteLength = palette.length
      index = pickIndex(paletteLength, forbidden)
      assignments.set(name, index)
      bump(index)
    }

    // Track this resolve so the next series of the same chart can avoid it.
    recent.set(chartKey, { order: normalizedOrder, index })

    return index
  }

  const reset = () => {
    assignments.clear()
    usage.clear()
    recent.clear()
  }

  return {
    resolveDiscriminator,
    reset,
  }
}
