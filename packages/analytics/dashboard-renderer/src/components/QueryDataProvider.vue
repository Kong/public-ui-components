<template>
  <!-- Loading state -->
  <KSkeleton
    v-if="isLoading || (!data && !hasError)"
    class="chart-skeleton"
    type="table"
  />
  <!-- Error state -->
  <KEmptyState
    v-else-if="!isLoading && hasError"
    cta-is-hidden
    data-testid="chart-empty-state"
    is-error
  >
    <template #message>
      {{ errorMessage }}
    </template>
  </KEmptyState>

  <slot
    v-else
    :data="data"
  />
</template>
<script setup lang="ts">
import { computed, inject, onUnmounted, ref } from 'vue'
import useSWRV from 'swrv'
import type { QueryProvider } from '../types/query-provider'
import { INJECT_QUERY_PROVIDER } from '../types/query-provider'
import { useSwrvState } from '@kong-ui-public/core'

const props = defineProps<{
  query: any // TODO: Explore v4
  queryReady: boolean,
}>()

const emit = defineEmits(['queryComplete'])

const queryBridge: QueryProvider | undefined = inject(INJECT_QUERY_PROVIDER)

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

const { data, error, isValidating } = useSWRV(queryKey, async () => {
  try {
    // Note that queryBridge is guaranteed to be set here because SWRV won't execute the query if the key is null.
    return queryBridge?.query(props.query, abortController)
  } catch (e) {
    // Note: 'Range not allowed' is defined by the API, therefore cannot be stored as string translation
    // errorMessage.value = e?.response?.data?.message === 'Range not allowed for this tier'
    //     ? i18n.t('configuration.vitals.reports.timeRangeExceeded')
    //     : e?.response?.data?.message || e?.message
    // TODO: Re-implement this once translations are in ^^
    errorMessage.value = 'Error'
  } finally {
    emit('queryComplete')
  }
})

const { state, swrvState: STATE } = useSwrvState(data, error, isValidating)

const errorMessage = ref<string | null>(null)
const hasError = computed(() => state.value === STATE.ERROR || !!errorMessage.value)
const isLoading = computed(() => !props.queryReady || state.value === STATE.PENDING)

</script>
