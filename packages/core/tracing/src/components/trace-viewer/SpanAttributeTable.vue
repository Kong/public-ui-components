<template>
  <div class="span-attribute-table">
    <div class="title">
      {{ t('trace_viewer.span_attributes.title') }}
    </div>

    <div class="attributes">
      <SpanAttribute
        v-for="keyValue in attributes"
        :key="keyValue.key"
        :key-value="keyValue"
        :span="span"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../../composables'
import { WATERFALL_ROW_PADDING_X } from '../../constants'
import type { IKeyValue, Span } from '../../types'
import SpanAttribute from './SpanAttribute.vue'

const { i18n: { t } } = composables.useI18n()

defineProps<{
  attributes: IKeyValue[]
  span: Span
}>()
</script>

<style lang="scss" scoped>
.span-attribute-table {
  align-items: flex-start;
  display: flex;
  flex-direction: column;

  .title {
    background-color: $kui-color-background-neutral-weakest;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-60 v-bind(WATERFALL_ROW_PADDING_X);
    width: 100%;
  }

  .attributes {
    width: 100%;

    :deep(.config-card-details-value) {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-30;

      .copy-text {
        font-size: $kui-font-size-30;
      }
    }
  }
}
</style>
