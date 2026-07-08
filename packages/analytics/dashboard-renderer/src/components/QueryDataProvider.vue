<template>
  <KSkeleton
    v-if="(isLoading || (!v4Data && !hasError)) && !displayData"
    class="chart-skeleton"
    type="table"
  />
  <KEmptyState
    v-else-if="hasError && !isLoading"
    :action-button-visible="false"
    data-testid="chart-empty-state"
  >
    <template #icon>
      <VisibilityOffIcon v-if="queryError?.type === 'forbidden'" />
      <WarningOutlineIcon v-else />
    </template>
    <template #title>
      <p>{{ queryError?.message || i18n.t('renderer.unexpectedError') }}</p>
    </template>
    <template
      v-if="queryError?.details"
      #default
    >
      <p>{{ queryError.details }}</p>
    </template>
  </KEmptyState>

  <slot
    v-else-if="displayData"
    :data="displayData"
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
import type {
  AnalyticsBridge,
  ExploreResultV4,
  ValidDashboardChartQuery,
} from '@kong-ui-public/analytics-utilities'
import type { QueryError } from '@kong-ui-public/analytics-chart'
import type { DashboardRendererContextInternal } from '../types'

import { computed, inject, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import { handleQueryError } from '@kong-ui-public/analytics-chart'

import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'

const props = defineProps<{
  context: DashboardRendererContextInternal
  limitOverride?: number
  query: ValidDashboardChartQuery
  queryReady: boolean
  refreshCounter: number
}>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const { issueQuery } = composables.useIssueQuery()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

const queryKey = () => {
  // SWRV can't accept `false` as a key, so use a more complicated conditional to match its `IKey` interface.
  if (props.queryReady && queryBridge) {
    return JSON.stringify([props.query, props.context, props.refreshCounter])
  }

  return null
}

const { data: v4Data, error, isValidating } = useSWRV(queryKey, async () => {
  const startKey = queryKey()

  try {
    const result = await issueQuery(props.query, props.context, props.limitOverride)

    if (queryKey() !== startKey) {
      // The original fetch has been superseded by a newer query
      return undefined
    }

    queryError.value = null

    return result
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

const { state, swrvState: STATE } = useSwrvState(v4Data, error, isValidating)

const queryError = ref<QueryError | null>(null)
const hasError = computed(() => state.value === STATE.ERROR || !!queryError.value)
const isLoading = computed(() => !props.queryReady || state.value === STATE.PENDING)

const oldData = ref<ExploreResultV4 | undefined>()
const displayData = computed(() => {
  return v4Data.value ?? (props.queryReady && state.value === STATE.PENDING ? oldData.value : undefined)
})

watch([() => v4Data.value, () => state.value], ([data, state]) => {
  if (data && (state === 'SUCCESS_HAS_DATA' || state === 'SUCCESS') && data !== oldData.value) {
    oldData.value = data
    emit('chart-data', data)
  }
})
</script>
