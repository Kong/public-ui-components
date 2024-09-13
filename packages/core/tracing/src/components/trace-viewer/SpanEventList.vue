<template>
  <div
    v-if="props.span.events && props.span.events.length > 0"
    class="span-events"
  >
    <div class="title">
      {{ t('trace_viewer.span_events.title') }}
    </div>

    <div class="events">
      <SpanEvent
        v-for="(event, i) in props.span.events"
        :key="i"
        :event="event"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import { type PropType } from 'vue'
import type { Span } from '../../types'
import SpanEvent from './SpanEvent.vue'
import composables from '../../composables'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  span: {
    type: Object as PropType<Span>,
    required: true,
  },
})

</script>

<style lang="scss" scoped>
.span-events {
  align-items: flex-start;
  display: flex;
  flex-direction: column;

  .title {
    background-color: $kui-color-background;
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-60 0;
    position: sticky;
    top: 0;
    width: 100%;
  }

  .events {
    width: 100%;

    .empty-state {
      align-items: center;
      background-color: $kui-color-background-neutral-weakest;
      border-radius: $kui-border-radius-20;
      display: flex;
      height: 100%;
      justify-content: center;
      min-height: 200px;
      width: 100%;
    }
  }
}
</style>
