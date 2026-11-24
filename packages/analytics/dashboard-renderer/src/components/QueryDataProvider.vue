<template>
  <KEmptyState
    v-if="isEmpty"
    :action-button-visible="false"
    data-testid="chart-no-data-state"
  >
    <template #title>
      <p>{{ i18n.t('renderer.noDataAvailable.title') }}</p>
    </template>
    <template #default>
      <p>{{ i18n.t('renderer.noDataAvailable.description') }}</p>
    </template>
  </KEmptyState>
  <KSkeleton
    v-else-if="(isLoading || (!v4Data && !hasError)) && !displayData"
    class="chart-skeleton"
    type="table"
  />
  <KEmptyState
    v-else-if="hasError && !isLoading"
    :action-button-visible="false"
    data-testid="chart-empty-state"
  >
    <template #icon>
      <VisibilityOffIcon v-if="displayError?.type === 'forbidden'" />
      <WarningOutlineIcon v-else />
    </template>
    <template #title>
      <p>{{ displayError?.message || i18n.t('renderer.unexpectedError') }}</p>
    </template>
    <template
      v-if="displayError?.details"
      #default
    >
      <p>{{ displayError.details }}</p>
    </template>
  </KEmptyState>

  <LoadingOverlay
    v-else-if="displayData"
    :loading="isStale"
  >
    <slot :data="displayData" />
  </LoadingOverlay>
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
import type {
  AnalyticsBridge,
  ExploreResultV4,
  ValidDashboardChartQuery,
} from '@kong-ui-public/analytics-utilities'
import type { QueryError } from '@kong-ui-public/analytics-chart'
import type { DashboardRendererContext, SuppliedTileData } from '../types'

import { computed, inject, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import { handleQueryError, LoadingOverlay } from '@kong-ui-public/analytics-chart'

import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { isExploreResultV4, resolveSuppliedData } from '../utils/supplied-tile-data'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'

const props = defineProps<{
  context: DashboardRendererContext
  limitOverride?: number
  query: ValidDashboardChartQuery
  queryReady: boolean
  refreshCounter: number
  /** When set, the provider shows this data and doesn't run a query. */
  suppliedData?: SuppliedTileData
}>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const { issueQuery } = composables.useIssueQuery()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

const suppliedState = computed(() => props.suppliedData && resolveSuppliedData({
  supplied: props.suppliedData,
  isExpected: isExploreResultV4,
  mismatchMessage: i18n.t('renderer.suppliedDataMismatch'),
}))

const queryKey = () => {
  // SWRV can't accept `false` as a key, so use a more complicated conditional to match its `IKey` interface.
  // A null key also keeps SWRV from fetching while the host supplies the data.
  if (props.queryReady && queryBridge && !props.suppliedData) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

const { data: keyedData, error, isValidating } = useSWRV<
  { key: string, result: ExploreResultV4 } | undefined
>(queryKey, async (startKey: string) => {
  try {
    const result = await issueQuery(props.query, props.context, props.limitOverride)

    if (queryKey() !== startKey) {
      // The original fetch has been superseded by a newer query
      return undefined
    }

    queryError.value = null

    return { key: startKey, result }
  } catch (e: any) {
    if (queryKey() !== startKey) {
      // This will avoid an empty error state when a query has been aborted
      return undefined
    }

    // Note: The error object will contain a response status property at the root when the analytics bridge
    // detects a 403 or 408 status code. This allows us to provide proper error messages for impacted tiles.
    queryError.value = handleQueryError(e)

    throw e
  } finally {
    if (queryKey() === startKey) {
      emit('query-complete')
    }
  }
}, {
  refreshInterval: props.context.refreshInterval,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
})

const v4Data = computed(() => keyedData.value?.result)

const { state, swrvState: STATE } = useSwrvState(keyedData, error, isValidating)

const queryError = ref<QueryError | null>(null)

// Each state below reads the supplied data when the host passes it, and the query otherwise.
const displayError = computed<QueryError | null>(() => {
  if (suppliedState.value) {
    return suppliedState.value.status === 'error' ? { type: 'other', message: suppliedState.value.message } : null
  }

  return queryError.value
})
const hasError = computed(() => suppliedState.value
  ? suppliedState.value.status === 'error'
  : state.value === STATE.ERROR || !!queryError.value)
const isLoading = computed(() => suppliedState.value
  ? suppliedState.value.status === 'loading'
  : !props.queryReady || state.value === STATE.PENDING)
const isEmpty = computed(() => suppliedState.value?.status === 'empty')

const oldData = ref<ExploreResultV4 | undefined>()
const displayData = computed(() => {
  if (suppliedState.value) {
    return suppliedState.value.status === 'success' ? suppliedState.value.data : undefined
  }

  return v4Data.value ?? (props.queryReady && state.value === STATE.PENDING ? oldData.value : undefined)
})

const isStale = computed(() => !suppliedState.value && !!displayData.value && keyedData.value?.key !== queryKey())

watch([() => v4Data.value, () => state.value], ([data, state]) => {
  if (data && (state === 'SUCCESS_HAS_DATA' || state === 'SUCCESS') && data !== oldData.value) {
    oldData.value = data
    emit('chart-data', data)
  }
}, { immediate: true })

watch(suppliedState, current => {
  if (!current || current.status === 'loading') {
    return
  }

  if (current.status === 'success') {
    emit('chart-data', current.data)
  }

  emit('query-complete')
}, { immediate: true })
</script>
