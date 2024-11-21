<template>
  <div class="span-events">
    <SpanEvent
      v-for="(event, i) in span.events"
      :key="i"
      :event="event"
    />
  </div>
</template>

<script setup lang="ts">
import type { Span } from '../../types'
import SpanEvent from './SpanEvent.vue'

defineProps<{ span: Span }>()
</script>

<style lang="scss" scoped>
.span-events {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}
</style>
