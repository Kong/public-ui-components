<template>
  <div
    v-if="span.events"
    class="span-events"
  >
    <SpanEvent
      v-for="(event, i) in span.events"
      :key="i"
      :event="event"
    />
  </div>
</template>

<script setup lang="ts">
import type { SpanNode } from '../../types'
import SpanEvent from './SpanEvent.vue'

defineProps<{ span: SpanNode['span'] }>()
</script>

<style lang="scss" scoped>
.span-events {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}
</style>
