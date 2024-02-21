import { computed, type Ref } from 'vue'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result, ExploreResultV4, AnalyticsExploreRecord, DisplayBlob, QueryResponseMeta, DimensionMap } from '../types'

export default function useExploreV4ResultTranslator(exploreResult: Ref<AnalyticsExploreResult | AnalyticsExploreV2Result>) {

  const v4Result = computed(() => {
    if (!exploreResult.value || !exploreResult.value.records || !exploreResult.value.meta) {
      return null
    }

    const display = Object.entries(exploreResult.value.meta.dimensions as DimensionMap).reduce((acc: DisplayBlob, [key, value]) => {
      acc[key] = {}
      value.forEach((item) => {
        acc[key][item] = { name: item, deleted: false }
      })

      return acc
    }, {})

    const result: ExploreResultV4 = {
      data: exploreResult.value.records as AnalyticsExploreRecord[],
      meta: {
        start_ms: 'start' in exploreResult.value.meta ? exploreResult.value.meta.start * 1000 : exploreResult.value.meta.startMs,
        end_ms: 'end' in exploreResult.value.meta ? exploreResult.value.meta.end * 1000 : exploreResult.value.meta.endMs,
        metric_names: exploreResult.value.meta.metricNames,
        metric_units: exploreResult.value.meta.metricUnits,
        granularity_ms: exploreResult.value.meta.granularity,
        truncated: exploreResult.value.meta.truncated,
        limit: exploreResult.value.meta.limit,
        display,
      } as QueryResponseMeta,
    }

    return result

  })

  return {
    v4Result,
  }
}
