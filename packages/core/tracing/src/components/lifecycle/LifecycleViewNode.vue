<template>
  <div class="lifecycle-view-node">
    <KBadge
      v-if="data.badge"
      appearance="neutral"
      class="badge"
    >
      {{ data.badge }}
    </KBadge>

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

    <div
      v-if="data.durationNano"
      class="duration"
    >
      {{ fmt(data.durationNano) }}
    </div>
  </div>

  <Handle
    v-if="targetPosition"
    :class="{ 'client-handle': data.type === LifecycleNodeType.CLIENT }"
    :connectable="false"
    :position="targetPosition"
    type="target"
  >
    <template v-if="data.type === LifecycleNodeType.CLIENT">
      {{ t('lifecycle.response') }}
    </template>
  </Handle>

  <Handle
    v-if="sourcePosition"
    :class="{ 'client-handle': data.type === LifecycleNodeType.CLIENT }"
    :connectable="false"
    :position="sourcePosition"
    type="source"
  >
    <template v-if="data.type === LifecycleNodeType.CLIENT">
      {{ t('lifecycle.request') }}
    </template>
  </Handle>
</template>

<script lang="ts" setup>
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import type { Position } from '@vue-flow/core'
import { Handle } from '@vue-flow/core'
import { computed } from 'vue'
import { LifecycleNodeType } from '../../constants'
import type { LifecycleNodeData } from '../../types'
import { getDurationFormatter } from '../../utils'
import composables from '../../composables'

const fmt = getDurationFormatter()
const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  sourcePosition?: Position
  targetPosition?: Position
  data: LifecycleNodeData
}>()

const tooltipText = computed(() => props.data.type === 'upstream' ? 'This is an upstream phase' : undefined)
</script>

<style lang="scss" scoped>
.client-handle {
  background: $kui-color-background !important;
  font-size: $kui-font-size-10;
  height: auto;
  padding: 0 $kui-space-10;
  width: auto;
}

.lifecycle-view-node {
  align-items: center;
  border-radius: $kui-border-radius-30;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 60px;
  padding: $kui-space-50;

  .badge {
    margin-bottom: $kui-space-20;
    padding: $kui-space-10 $kui-space-20;
  }

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
}
</style>
