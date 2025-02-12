<template>
  <div class="legend">
    <!-- Hide total latency for now -->
    <div class="latency">
      <span>{{ t('lifecycle.total') }}: </span>
      <span>{{ fmt(props.rootSpan.durationNano) }}</span>
    </div>

    <div
      v-for="color in colors"
      :key="color.color"
      class="color"
    >
      <div
        class="preview"
        :style="{ backgroundColor: color.color }"
      />

      <div class="label">
        {{ color.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../../composables'
import { NODE_STRIPE_COLOR_MAPPING, NODE_STRIPE_COLOR_MAPPING_START_EXP } from '../../constants'
import type { SpanNode } from '../../types'
import { getDurationFormatter } from '../../utils'

const props = defineProps<{
  rootSpan: SpanNode
}>()

const fmt = getDurationFormatter()
const { i18n: { t } } = composables.useI18n()

// No need to be reactive
const colors = NODE_STRIPE_COLOR_MAPPING.toReversed().map((color, i) => {
  const ri = (NODE_STRIPE_COLOR_MAPPING.length - 1 - i)
  return {
    label: `${
      fmt(10 ** (NODE_STRIPE_COLOR_MAPPING_START_EXP + ri))
    } - ${
      fmt(10 ** (NODE_STRIPE_COLOR_MAPPING_START_EXP + ri + (i === 0 ? 2 : 1)))
    }${
      i === 0 ? '+' : ''
    }`,
    color,
  }
})
</script>

<style lang="scss" scoped>
.legend {
  background-color: $kui-color-background;
  bottom: 0;
  box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.08); // Align with VueFlow built-in Control
  font-size: $kui-font-size-20;
  margin: $kui-space-60;
  padding: $kui-space-20 $kui-space-40;
  position: absolute;
  right: 0;
  z-index: 1000;

  .color {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-20;
    justify-content: flex-start;

    .preview {
      border-radius: $kui-border-radius-10;
      height: 10px;
      width: 10px;
    }

    .label {
      font-size: $kui-font-size-20;
    }
  }
}
</style>
