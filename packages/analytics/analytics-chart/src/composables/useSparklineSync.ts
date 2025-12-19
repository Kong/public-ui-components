import { computed, onUnmounted, ref, type Ref, watchEffect } from 'vue'
import type { SparklineDataset, SparklineType } from '../types'
import bucketTimestamps from '../utils/bucketTimestamps'

type SparkState = {
  minCounts: Record<string, number>
  maxCounts: Record<string, number>
  minStamps: Record<string, number>
  maxStamps: Record<string, number>
  renderPoints: Record<string, number>
}

const createState = (): SparkState => ({
  minCounts: {},
  maxCounts: {},
  minStamps: {},
  maxStamps: {},
  renderPoints: {},
})

const globalSparkStates = ref<Record<string, SparkState>>({})

const getStateByGroup = (groupKey: string): SparkState => {
  if (!globalSparkStates.value[groupKey]) {
    // initialize the tracker if it doesn't exist yet
    globalSparkStates.value[groupKey] = createState()
  }

  return globalSparkStates.value[groupKey]
}

const clearState = (chartKey: string, groupKey: string) => {
  const state = globalSparkStates.value[groupKey]
  if (!state) return // the state for this chart/group was ephemeral

  const chartInState = state.minCounts[chartKey] !== undefined
    || state.maxCounts[chartKey] !== undefined
    || state.minStamps[chartKey] !== undefined
    || state.maxStamps[chartKey] !== undefined
    || state.renderPoints[chartKey] !== undefined

  if (state && chartInState) {
    // delete the state for this instance
    delete state.minCounts[chartKey]
    delete state.maxCounts[chartKey]
    delete state.minStamps[chartKey]
    delete state.maxStamps[chartKey]
    delete state.renderPoints[chartKey]

    const hasOtherState = Object.keys(state.minCounts).length
      || Object.keys(state.maxCounts).length
      || Object.keys(state.minStamps).length
      || Object.keys(state.maxStamps).length
      || Object.keys(state.renderPoints).length

    if (!hasOtherState) {
      // if all the state for this group is gone, delete the whole group
      delete globalSparkStates.value[groupKey]
    }
  }
}

export default function useSparklineSync({
  chartKey,
  datasets,
  groupKey,
  minStamp = undefined,
  maxStamp = undefined,
  minCount = undefined,
  maxCount = undefined,
  renderPoints = undefined,
  type,
}: {
  chartKey?: string
  datasets: SparklineDataset[]
  groupKey?: string
  minStamp?: number
  maxStamp?: number
  minCount?: number
  maxCount?: number
  renderPoints?: number
  type: SparklineType
}): {
  syncedGroupSizeMs: Ref<number>
  syncedMinStamp: Ref<number>
  syncedMaxStamp: Ref<number>
  syncedMinCount: Ref<number>
  syncedMaxCount: Ref<number>
  syncedRenderPoints: Ref<number>
  syncedChartDatasets: Ref<Array<{
    label: string
    data: Array<{ x: number, y: number }>
    backgroundColor?: string
    fill?: boolean
  }>>
} {
  const DEFAULT_RENDER_POINTS = 24

  const state = groupKey !== undefined && chartKey !== undefined ? getStateByGroup(groupKey) : createState()
  const localKey = chartKey !== undefined ? chartKey : 'static-chart-key'

  const allTimestamps = computed(() => datasets
    .reduce((acc: number[], { timestamps }): number[] => {
      return [...acc, ...timestamps]
    }, []))

  const actualMinStamp = computed(() => {
    if (minStamp) return minStamp

    return allTimestamps.value.reduce((acc, timestamp): number => {
      return acc === 0 ? timestamp : Math.min(acc, timestamp)
    }, 0)
  })

  const actualMaxStamp = computed(() => {
    if (maxStamp) return maxStamp

    return allTimestamps.value.reduce((acc, timestamp): number => {
      return Math.max(acc, timestamp)
    }, 0)
  })

  watchEffect(() => {
    state.minStamps[localKey] = actualMinStamp.value
    state.maxStamps[localKey] = actualMaxStamp.value
    if (renderPoints !== undefined) {
      state.renderPoints[localKey] = renderPoints
    }
  })

  const syncedMinStamp = computed<number>(() => {
    return Object.values(state.minStamps)
      .reduce((min, stamp): number => {
        return min === 0 ? stamp : Math.min(min, stamp)
      }, 0)
  })

  const syncedMaxStamp = computed<number>(() => {
    return Object.values(state.maxStamps)
      .reduce((max, stamp): number => {
        return Math.max(max, stamp)
      }, 0)
  })

  const syncedRenderPoints = computed(() => {
    const values = Object.values(state.renderPoints)
    if (values.length === 0) {
      // if no sparkline defined renderPoints, then just use the default
      return DEFAULT_RENDER_POINTS
    }

    // otherwise, return the largest count (as long as it's 2 or greater)
    return values.reduce((max, points): number => {
      return Math.max(max, points)
    }, 2)
  })

  const syncedGroupSizeMs = computed<number>(() => {
    const range = syncedMaxStamp.value - syncedMinStamp.value
    return Math.ceil(range / syncedRenderPoints.value)
  })

  const isStacked = computed<boolean>(() => datasets.length > 1)

  const syncedChartDatasets = computed<Array<{
    label: string
    data: Array<{ x: number, y: number }>
    backgroundColor?: string
    fill?: boolean
  }>>(() => datasets.map(({ timestamps, color, label }) => {
    const buckets = bucketTimestamps({
      bucketCount: syncedRenderPoints.value,
      minStamp: syncedMinStamp.value,
      maxStamp: syncedMaxStamp.value,
      timestamps,
    })

    const data = buckets.map(([timestamp, count]) => ({
      x: timestamp,
      y: count,
    }))

    return {
      data,
      label,
      ...((type === 'sparkline_bar' || isStacked.value) && color && { backgroundColor: color }),
      ...(type !== 'sparkline_bar' && color && { borderColor: color }),
      ...(isStacked.value && type !== 'sparkline_bar' && { fill: true }),
    }
  }))

  const compoundCounts = computed<number[]>(() => {
    // the counts when all datasets are stacked on top of each other
    const bucketCount = syncedChartDatasets.value[0]?.data?.length ?? 0
    const counts = []

    for (let i = 0; i < bucketCount; i++) {
      let value = 0
      for (let j = 0; j < syncedChartDatasets.value.length; j++) {
        value += syncedChartDatasets.value[j]?.data[i]?.y ?? 0
      }
      counts.push(value)
    }
    return counts
  })

  const actualMaxCount = computed(() => {
    const datasetsMax = compoundCounts.value.reduce((max, count): number => {
      return Math.max(max, count)
    }, 0)

    return Math.max(datasetsMax, maxCount ?? 0)
  })

  const actualMinCount = computed(() => {
    const allCounts = syncedChartDatasets.value.reduce((acc, { data }) => {
      return [...acc, ...data.map(({ y }) => y)]
    }, [] as number[])

    const firstValue = allCounts.length ? allCounts[0]! : 0
    const datasetsMin = allCounts.reduce((min, count): number => {
      return Math.min(min, count)
    }, firstValue)

    return minCount === undefined
      ? datasetsMin
      : Math.min(datasetsMin, minCount)
  })

  watchEffect(() => {
    state.maxCounts[localKey] = actualMaxCount.value
    state.minCounts[localKey] = actualMinCount.value
  })

  const syncedMinCount = computed(() => {
    const values = Object.values(state.minCounts)
    const firstValue = values.length ? values[0]! : 0
    return values.reduce((min, count): number => {
      return Math.min(min, count)
    }, firstValue)
  })

  const syncedMaxCount = computed(() => {
    return Object.values(state.maxCounts)
      .reduce((max, count): number => {
        return Math.max(max, count)
      }, 0)
  })

  onUnmounted(() => {
    if (chartKey !== undefined && groupKey !== undefined) {
      // our state is ephemeral unless we have a chartKey AND a groupKey. In
      // that case we should clean up after ourselves on unmount.
      clearState(chartKey, groupKey)
    }
  })

  return {
    syncedMinStamp,
    syncedMaxStamp,
    syncedRenderPoints,
    syncedChartDatasets,
    syncedGroupSizeMs,
    syncedMinCount,
    syncedMaxCount,
  }
}
