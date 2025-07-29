<template>
  <KSkeleton
    v-if="isLoading || (!v4Data && !hasError)"
    class="chart-skeleton"
    type="table"
  />
  <KEmptyState
    v-else-if="hasError"
    :action-button-visible="false"
    data-testid="chart-empty-state"
    icon-variant="error"
  >
    <template #default>
      {{ errorMessage }}
    </template>
  </KEmptyState>

  <slot
    v-else-if="v4Data"
    :data="v4Data"
  />
</template>
<script setup lang="ts">
/*
 * A note about the conditionals in the template:
 * It's impossible to reach step 3 (render the slot) unless you have data.
 * If you aren't loading (bypassing step 1), and you don't have an error (bypassing step 2),
 * the only way to also have no data also lands you in step 1 (via `(!data && !hasError)`).
 * However, TS doesn't seem to narrow this type correctly, so there's an explicit `v-else-if`
 * on the third step to ensure that the type is correctly inferred as "not undefined".
 */

import { computed, inject, onUnmounted, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import composables from '../composables'
import type {
  AllFilters,
  AnalyticsBridge,
  DatasourceAwareQuery,
  ExploreFilterAll,
  ExploreQuery,
  ExploreResultV4,
  FilterTypeMap,
  QueryDatasource,
  TimeRangeV4,
  ValidDashboardQuery,
} from '@kong-ui-public/analytics-utilities'
import { stripUnknownFilters } from '@kong-ui-public/analytics-utilities'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'

const props = defineProps<{
  context: DashboardRendererContextInternal
  query: ValidDashboardQuery
  queryReady: boolean
  refreshCounter: number
}>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'queryComplete'): void
}>()

const { i18n } = composables.useI18n()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

const queryKey = () => {
  // SWRV can't accept `false` as a key, so use a more complicated conditional to match its `IKey` interface.
  if (props.queryReady && queryBridge) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

// Ensure that any pending requests are canceled on unmount.
const abortController = new AbortController()

onUnmounted(() => {
  abortController.abort()
})

const deriveFilters = <D extends QueryDatasource>(datasource: D, queryFilters: Array<FilterTypeMap[D]> | undefined, contextFilters: AllFilters[]): Array<FilterTypeMap[D]> => {
  const mergedFilters: Array<FilterTypeMap[D]> = []

  if (queryFilters) {
    // The filters from the query should be safe -- as in, validated to be compatible
    // with the chosen endpoint.
    mergedFilters.push(...queryFilters)
  }

  // The contextual filters may not be compatible and need to be pruned.
  mergedFilters.push(...stripUnknownFilters(datasource, contextFilters))

  return mergedFilters
}

const { data: v4Data, error, isValidating } = useSWRV(queryKey, async () => {
  try {
    let {
      datasource,
      ...rest
    } = props.query

    if (!datasource) {
      datasource = 'basic'
    }

    const mergedFilters = deriveFilters(datasource, props.query.filters as Array<FilterTypeMap[typeof datasource]>, props.context.filters)

    // TODO: the cast is necessary because TimeRangeV4 specifies date objects for absolute time ranges.
    // If they're coming from a definition, they're strings; should clean this up as part of the dashboard type work.
    let time_range = props.query.time_range as TimeRangeV4 | undefined

    if (!time_range) {
      time_range = {
        ...props.context.timeSpec,
        tz: props.context.tz,
      }
    } else if (!time_range.tz) {
      time_range = {
        ...time_range,
        tz: props.context.tz,
      }
    }

    // TODO: similar to other places, consider adding a type guard to ensure the query
    // matches the datasource.  Currently, this block effectively pretends all queries
    // are advanced in order to make the types work out.
    const mergedQuery: DatasourceAwareQuery = {
      datasource: datasource as 'api_usage',
      query: {
        ...rest as ExploreQuery,
        time_range,
        filters: mergedFilters as ExploreFilterAll[],
      },
    }

    // Note that queryBridge is guaranteed to be set here because SWRV won't execute the query if the key is null.
    return queryBridge?.queryFn(mergedQuery, abortController)
  } catch (e: any) {
    // Note: The error object will contain a response status property at the root when the analytics bridge
    // detects a 403 or 408 status code. This allows us to provide proper error messages for impacted tiles.
    if (e?.status === 403) {
      errorMessage.value = i18n.t('queryDataProvider.forbidden')
    } else if (e?.status === 408) {
      errorMessage.value = i18n.t('queryDataProvider.timeout')
    } else if (e?.response?.data?.message === 'Range not allowed for this tier') {
      // Note: 'Range not allowed' is defined by the API, therefore cannot be stored as string translation
      errorMessage.value = i18n.t('queryDataProvider.timeRangeExceeded')
    } else {
      errorMessage.value = e?.response?.data?.message || e?.message
    }
  } finally {
    emit('queryComplete')
  }
}, {
  refreshInterval: props.context.refreshInterval,
  revalidateOnFocus: false,
})

const { state, swrvState: STATE } = useSwrvState(v4Data, error, isValidating)

const errorMessage = ref<string | null>(null)
const hasError = computed(() => state.value === STATE.ERROR || !!errorMessage.value)
const isLoading = computed(() => !props.queryReady || state.value === STATE.PENDING)

watch(v4Data, (data) => {
  if (data) {
    emit('chart-data', data)
  }
})

</script>
