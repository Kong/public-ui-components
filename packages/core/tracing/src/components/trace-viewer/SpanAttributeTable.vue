<template>
  <div class="span-attribute-table">
    <div class="title">
      {{ t('trace_viewer.span_attributes.title') }}
    </div>

    <div class="attributes">
      <SpanAttribute
        v-for="attributes in internalAttributes"
        :key="attributes.key"
        :key-value="attributes"
        :label="attributes.label"
        :span="span"
      />

      <template v-if="filteredAttributes.length > 0">
        <SpanAttribute
          v-for="keyValue in filteredAttributes"
          :key="keyValue.key"
          :key-value="keyValue"
          :span="span"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import { SPAN_ATTR_KEY_KONG_LATENCY_PREFIX, WATERFALL_ROW_PADDING_X } from '../../constants'
import type { IKeyValue, SpanNode } from '../../types'
import { formatNanoDateTimeString } from '../../utils'
import SpanAttribute from './SpanAttribute.vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const internalAttributes = computed<(IKeyValue & { label?: string })[]>(() => {
  return [
    {
      // Hardcoding the key here as it's not used elsewhere
      key: '_internal.start_time',
      value: {
        stringValue: formatNanoDateTimeString(props.span.startTimeUnixNano),
      },
      label: t('span_attributes.labels.start_time'),
    },
    {
      // Hardcoding the key here as it's not used elsewhere
      key: '_internal.end_time',
      value: {
        stringValue: formatNanoDateTimeString(props.span.endTimeUnixNano),
      },
      label: t('span_attributes.labels.end_time'),
    },
  ]
})

const filteredAttributes = computed(() => {
  if (!props.span.attributes) {
    return []
  }

  return props.span.attributes
    .filter((attr) => !attr.key.startsWith(SPAN_ATTR_KEY_KONG_LATENCY_PREFIX))
})
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
