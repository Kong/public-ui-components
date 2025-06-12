<template>
  <KAlert
    v-if="exceptionMessage"
    appearance="warning"
    :message="exceptionMessage"
    show-icon
    :style="{ width: '100%' }"
    :title="t('trace_viewer.span_events.exception_message.title')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import { SPAN_EVENT_ATTRIBUTE_KEYS } from '../../constants'
import type { SpanEventsInner } from '@kong/sdk-konnect-js-internal'
import type { SpanAttributes } from '../../types'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ event: SpanEventsInner }>()

// We only have exception-typed events for now
const exceptionMessage = computed(() => {
  const message = (props.event.attributes as SpanAttributes)?.[SPAN_EVENT_ATTRIBUTE_KEYS.EXCEPTION_MESSAGE]

  if (message && typeof message === 'string') {
    return message
  }

  return ''
})
</script>
