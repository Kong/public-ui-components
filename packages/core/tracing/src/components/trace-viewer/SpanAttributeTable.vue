<template>
  <div
    v-if="span.attributes.length > 0"
    class="span-attribute-table"
  >
    <div class="title">
      {{ t('trace_viewer.span_attributes.title') }}
    </div>

    <div class="attributes">
      <SpanAttribute
        v-for="keyValue in span.attributes"
        :key="keyValue.key"
        :key-value="keyValue"
        :span="span"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import { type PropType } from 'vue'
import composables from '../../composables'
import type { Span } from '../../types'
import SpanAttribute from './SpanAttribute.vue'

const { i18n: { t } } = composables.useI18n()

defineProps({
  span: {
    type: Object as PropType<Span>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.span-attribute-table {
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

  .attributes {
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
