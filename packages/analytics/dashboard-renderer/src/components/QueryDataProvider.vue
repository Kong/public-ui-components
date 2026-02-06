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
import type {
  AnalyticsBridge,
  ExploreResultV4,
  ValidDashboardQuery,
} from '@kong-ui-public/analytics-utilities'
import type { QueryError } from '@kong-ui-public/analytics-chart'
import type { DashboardRendererContextInternal } from '../types'

import { computed, inject, nextTick, ref, watch } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import { handleQueryError, isCanceledError } from '@kong-ui-public/analytics-chart'

import composables from '../composables'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { VisibilityOffIcon, WarningOutlineIcon } from '@kong/icons'

const props = defineProps<{
  context: DashboardRendererContextInternal
  limitOverride?: number
  query: ValidDashboardQuery
  queryReady: boolean
  refreshCounter: number
}>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'queryComplete'): void
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

const { data: v4Data, error, isValidating, mutate } = useSWRV(queryKey, async () => {
  try {
    const result = await issueQuery(props.query, props.context, props.limitOverride)
    queryError.value = null

    return result
  } catch (e: any) {
    // Note: The error object will contain a response status property at the root when the analytics bridge
    // detects a 403 or 408 status code. This allows us to provide proper error messages for impacted tiles.
    if (!isCanceledError(e)) {
      queryError.value = handleQueryError(e)
    }

    throw e
  } finally {
    isRetrying.value = false
    emit('queryComplete')
  }
}, {
  refreshInterval: props.context.refreshInterval,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
})

const { state, swrvState: STATE } = useSwrvState(v4Data, error, isValidating)

const queryError = ref<QueryError | null>(null)
const retriedKey = ref<string | null>(null)
const isRetrying = ref(false)
const hasError = computed(() => state.value === STATE.ERROR || !!queryError.value)
const isLoading = computed(() => !props.queryReady || state.value === STATE.PENDING || isRetrying.value)

/*
 * This handles the case where a previous navigation canceled a
 * request and left SWRV with an error state but no data.
 */
watch([error, v4Data], ([err]) => {
  const currentKey = queryKey()

  const shouldRetry = isCanceledError(err)
    && !v4Data.value
    && props.queryReady
    && currentKey
    && retriedKey.value !== currentKey

  if (shouldRetry) {
    retriedKey.value = currentKey
    isRetrying.value = true
    nextTick(() => mutate())
  }
})

watch([() => v4Data.value, () => state.value], ([data, state]) => {
  if (data && (state === 'SUCCESS_HAS_DATA' || state === 'SUCCESS')) {
    emit('chart-data', data)
  }
})
</script>
