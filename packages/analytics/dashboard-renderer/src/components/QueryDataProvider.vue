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
  ExploreFilter,
  ExploreQuery,
  ExploreResultV4,
  FilterTypeMap,
  QueryDatasource,
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
  (e: 'chart-data', chartData: ExploreResultV4): void,
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

const deriveFilters = <D extends QueryDatasource>(datasource: D, queryFilters: FilterTypeMap[D][] | undefined, contextFilters: AllFilters[]): FilterTypeMap[D][] => {
  const mergedFilters: FilterTypeMap[D][] = []

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

    const mergedFilters = deriveFilters(datasource, props.query.filters as FilterTypeMap[typeof datasource][], props.context.filters)

    // TODO: similar to other places, consider adding a type guard to ensure the query
    // matches the datasource.  Currently, this block effectively pretends all queries
    // are advanced in order to make the types work out.
    const mergedQuery: DatasourceAwareQuery = {
      datasource: datasource as 'advanced',
      query: {
        ...rest as ExploreQuery,
        time_range: {
          ...props.context.timeSpec,
          tz: props.context.tz,
        },
        filters: mergedFilters as ExploreFilter[],
      },
    }

    // Note that queryBridge is guaranteed to be set here because SWRV won't execute the query if the key is null.
    return queryBridge?.queryFn(mergedQuery, abortController)
  } catch (e: any) {
    // Note: 'Range not allowed' is defined by the API, therefore cannot be stored as string translation
    errorMessage.value = e?.response?.data?.message === 'Range not allowed for this tier'
      ? i18n.t('queryDataProvider.timeRangeExceeded')
      : e?.response?.data?.message || e?.message
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
