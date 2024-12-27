<template>
  <div :class="['lifecycle-view-node', nodeLatencyClass]">
    <div class="label">
      <span>
        {{ data.label }}
      </span>
      <KTooltip
        v-if="tooltipText"
        :text="tooltipText"
      >
        <InfoIcon :size="parseFloat(KUI_ICON_SIZE_30)" />
      </KTooltip>
    </div>

    <div class="duration">
      {{ fmt(data.durationNano) }}
    </div>
  </div>

  <Handle
    v-if="targetPosition"
    :connectable="false"
    :position="targetPosition"
    type="target"
  />

  <Handle
    v-if="sourcePosition"
    :connectable="false"
    :position="sourcePosition"
    type="source"
  />
</template>

<script lang="ts" setup>
import { InfoIcon } from '@kong/icons'
import type { Position } from '@vue-flow/core'
import { Handle } from '@vue-flow/core'
import { computed } from 'vue'
import type { LifecycleNodeData } from '../../types'
import { getDurationFormatter } from '../../utils'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

const fmt = getDurationFormatter()

const props = defineProps<{
  sourcePosition?: Position
  targetPosition?: Position
  data: LifecycleNodeData
}>()

const tooltipText = computed(() => props.data.type === 'upstream' ? 'This is an upstream phase' : undefined)

// TODO: This is skipped for now
const nodeLatencyClass = computed(() => {
  return ''
  // if (props.data.durationNano <= 1 * 1e6) {
  //   return 'latency-low'
  // } else if (props.data.durationNano <= 10 * 1e6) {
  //   return 'latency-medium'
  // } else {
  //   return 'latency-high'
  // }
})
</script>

<style lang="scss" scoped>
.lifecycle-view-node {
  align-items: center;
  border-radius: $kui-border-radius-30;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: $kui-space-50;

  .label {
    align-items: center;
    display: flex;
    flex-direction: row;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    gap: $kui-space-10;
  }

  .duration {
    font-size: $kui-font-size-20;
  }

  &.latency-low {
    background-color: $kui-color-background-primary-weakest;
  }

  &.latency-medium {
    background-color: $kui-color-background-primary-weaker;
  }

  &.latency-high {
    background-color: $kui-status-color-101; // blue.30 (but this is an inappropriate token)
  }
}
</style>
