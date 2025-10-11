import { computed, ref, type Ref, watchEffect } from 'vue'
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

export default function useSparklineSync({
  chartKey,
  datasets,
  groupKey,
  minStamp = undefined,
  maxStamp = undefined,
  minCount = undefined,
  maxCount = undefined,
  renderPoints = 24,
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

  const actualRenderPoints = computed(() => Math.max(2, renderPoints))

  watchEffect(() => {
    state.minStamps[localKey] = actualMinStamp.value
    state.maxStamps[localKey] = actualMaxStamp.value
    state.renderPoints[localKey] = actualRenderPoints.value
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
    return Object.values(state.renderPoints)
      .reduce((max, points): number => {
        return Math.max(max, points)
      }, 0)
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
      groupSizeMs: syncedGroupSizeMs.value,
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

  const allCounts = computed<number[]>(() => {
    const bucketSize = syncedChartDatasets.value[0]?.data?.length ?? 0
    const counts = []

    for (let i = 0; i < bucketSize; i++) {
      let value = 0
      for (let j = 0; j < syncedChartDatasets.value.length; j++) {
        value += syncedChartDatasets.value[j].data[i].y
      }
      counts.push(value)
    }
    return counts
  })

  const actualMaxCount = computed(() => {
    const datasetsMax = allCounts.value.reduce((max, count): number => {
      return Math.max(max, count)
    }, 0)

    return Math.max(datasetsMax, maxCount ?? 0)
  })

  const actualMinCount = computed(() => {
    const datasetsMin = allCounts.value.reduce((min, count): number => {
      return Math.min(min, count)
    }, 0)

    return Math.min(datasetsMin, minCount ?? 0)
  })

  watchEffect(() => {
    state.maxCounts[localKey] = actualMaxCount.value
    state.minCounts[localKey] = actualMinCount.value
  })

  const syncedMinCount = computed(() => {
    return Object.values(state.minCounts)
      .reduce((min, count): number => {
        return Math.min(min, count)
      }, 0)
  })

  const syncedMaxCount = computed(() => {
    return Object.values(state.maxCounts)
      .reduce((max, count): number => {
        return Math.max(max, count)
      }, 0)
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
