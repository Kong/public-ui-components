<template>
  <div class="span-attribute-table">
    <div class="title">
      {{ t('trace_viewer.span_attributes.title') }}
    </div>

    <div class="attributes">
      <SpanAttribute
        v-for="attributes in internalAttributes"
        :key="attributes.key"
        :attr-key="attributes.key"
        :label="attributes.label"
        :span="span"
        :value="attributes.value"
      />

      <template v-if="filteredAttributKeys.length > 0">
        <SpanAttribute
          v-for="attrKey in filteredAttributKeys"
          :key="attrKey"
          :attr-key="attrKey"
          :span="span"
          :value="attrKeyValue(attrKey)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import { SPAN_ATTR_KEY_KONG_LATENCY_PREFIX, WATERFALL_ROW_PADDING_X } from '../../constants'
import type { SpanAttributes, SpanNode } from '../../types'
import { formatNanoDateTimeString } from '../../utils'
import SpanAttribute from './SpanAttribute.vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const internalAttributes = computed(() => {
  return [
    {
      // Hardcoding the key here as it's not used elsewhere
      key: '_internal.start_time',
      value: formatNanoDateTimeString(props.span.start_time_unix_nano),
      label: t('span_attributes.labels.start_time'),
    },
    {
      // Hardcoding the key here as it's not used elsewhere
      key: '_internal.end_time',
      value: formatNanoDateTimeString(props.span.end_time_unix_nano),
      label: t('span_attributes.labels.end_time'),
    },
  ]
})

const filteredAttributKeys = computed(() => {
  if (!props.span.attributes) {
    return []
  }

  return Object.keys(props.span.attributes)
    .filter((key) => !key.startsWith(SPAN_ATTR_KEY_KONG_LATENCY_PREFIX))
})

const attrKeyValue = (key: string) => {
  if (!props.span.attributes) {
    return
  }
  return (props.span.attributes as SpanAttributes)[key]
}
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
