<template>
  <KAlert
    v-if="exceptionMessage"
    appearance="warning"
    :message="exceptionMessage"
    show-icon
    :title="t('trace_viewer.span_events.exception_message.title')"
  />
</template>

<script setup lang="tsx">
import { computed, type PropType } from 'vue'
import composables from '../../composables'
import { SPAN_EVENT_ATTRIBUTES } from '../../constants'
import type { Event } from '../../types'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: true,
  },
})

// We only have exception-typed events for now
const exceptionMessage = computed(() =>
  props.event.attributes
    .find((keyValue) => keyValue.key === SPAN_EVENT_ATTRIBUTES.EXCEPTION_MESSAGE.name)?.value.stringValue,
)
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
