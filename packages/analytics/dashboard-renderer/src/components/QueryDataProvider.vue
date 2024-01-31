<template>
  <KSkeleton
    v-if="isLoading || (!data && !hasError)"
    class="chart-skeleton"
    type="table"
  />
  <KEmptyState
    v-else-if="hasError"
    cta-is-hidden
    data-testid="chart-empty-state"
    is-error
  >
    <template #message>
      {{ errorMessage }}
    </template>
  </KEmptyState>

  <slot
    v-else-if="data"
    :data="data"
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

import { computed, inject, onUnmounted, ref } from 'vue'
import useSWRV from 'swrv'
import { useSwrvState } from '@kong-ui-public/core'
import composables from '../composables'
import type { AnalyticsBridge, ExploreQuery } from '@kong-ui-public/analytics-utilities'
import { INJECT_QUERY_PROVIDER } from '../constants'

const props = defineProps<{
  query: ExploreQuery
  queryReady: boolean,
}>()

const emit = defineEmits(['queryComplete'])

const { i18n } = composables.useI18n()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

const queryKey = () => {
  // SWRV can't accept `false` as a key, so use a more complicated conditional to match its `IKey` interface.
  if (props.queryReady && queryBridge) {
    return JSON.stringify(props.query)
  }

  return null
}

// Ensure that any pending requests are canceled on unmount.
const abortController = new AbortController()

onUnmounted(() => {
  abortController.abort()
})

const { data: v4Data, error, isValidating } = useSWRV(queryKey, async () => {
  try {
    // Note that queryBridge is guaranteed to be set here because SWRV won't execute the query if the key is null.
    return queryBridge?.queryFn(props.query, abortController)
  } catch (e: any) {
    // Note: 'Range not allowed' is defined by the API, therefore cannot be stored as string translation
    errorMessage.value = e?.response?.data?.message === 'Range not allowed for this tier'
      ? i18n.t('queryDataProvider.timeRangeExceeded')
      : e?.response?.data?.message || e?.message
  } finally {
    emit('queryComplete')
  }
})

// TODO: Support v4 natively and get rid of this hack.
const data = computed(() => {
  if (!v4Data.value) {
    return undefined
  }

  const v4Meta = v4Data.value.meta

  return {
    records: v4Data.value.data.map(d => ({
      ...d,
      event: Object.entries(d.event).reduce((acc, [k, v]) => {
        acc[k.toUpperCase()] = v
        return acc
      }, {} as Record<string, any>),
    })),
    meta: {
      ...v4Meta,
      metricNames: v4Meta.metric_names?.map(n => n.toUpperCase()),
      granularity: v4Meta.granularity_ms,
      startMs: v4Meta.start_ms,
      endMs: v4Meta.end_ms,

      // status_code_grouped: { '2XX': { name: '2XX' }} ->
      // STATUS_CODE_GROUPED: [ '2XX' ]
      dimensions: Object.entries(v4Meta.display).reduce((acc, [v, disp]) => {
        acc[v.toUpperCase()] = Object.keys(disp)
        return acc
      }, {} as Record<string, any>),
    },
  }
})

const { state, swrvState: STATE } = useSwrvState(data, error, isValidating)

const errorMessage = ref<string | null>(null)
const hasError = computed(() => state.value === STATE.ERROR || !!errorMessage.value)
const isLoading = computed(() => !props.queryReady || state.value === STATE.PENDING)

</script>
