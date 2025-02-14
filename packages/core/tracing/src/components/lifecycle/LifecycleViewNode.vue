<template>
  <div :class="rootClasses">
    <KBadge
      v-if="data.badge"
      :appearance="data.type === LifecycleNodeType.REQUEST ? BadgeAppearances.info : BadgeAppearances.decorative"
      class="badge"
    >
      {{ data.badge }}
    </KBadge>

    <div
      v-if="data.label"
      class="label"
    >
      <span>{{ data.label }}</span>

      <KTooltip
        v-if="data.labelTooltipKey"
        :text="t(data.labelTooltipKey)"
      >
        <InfoIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="parseFloat(KUI_ICON_SIZE_30)"
        />
      </KTooltip>
    </div>

    <div
      v-if="data.durationNano"
      class="duration"
    >
      <span>{{ fmt(data.durationNano) }}</span>

      <KTooltip
        v-if="data.durationTooltipKey"
        :text="t(data.durationTooltipKey)"
      >
        <InfoIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="parseFloat(KUI_ICON_SIZE_20)"
        />
      </KTooltip>
    </div>
  </div>

  <!-- aka. In -->
  <Handle
    v-if="!isGroupNode && targetPosition"
    class="handle"
    :connectable="false"
    :position="targetPosition"
    :style="data.showTargetHandle ? undefined : { visibility: 'hidden' }"
    type="target"
  />

  <!-- aka. Out -->
  <Handle
    v-if="!isGroupNode && sourcePosition"
    class="handle"
    :connectable="false"
    :position="sourcePosition"
    :style="data.showSourceHandle ? undefined : { visibility: 'hidden' }"
    type="source"
  />
</template>

<script lang="ts" setup>
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import { BadgeAppearances } from '@kong/kongponents'
import type { Position } from '@vue-flow/core'
import { Handle } from '@vue-flow/core'
import { computed } from 'vue'
import composables from '../../composables'
import { LifecycleNodeType, NODE_GROUP_PADDING, NODE_GROUP_ROW_GAP } from '../../constants'
import type { LifecycleNodeData } from '../../types'
import { getDurationFormatter, getNodeStripeColor } from '../../utils'

const fmt = getDurationFormatter()
const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  sourcePosition?: Position
  targetPosition?: Position
  data: LifecycleNodeData
}>()

const isGroupNode = computed(() =>
  props.data.type === LifecycleNodeType.REQUEST_GROUP || props.data.type === LifecycleNodeType.RESPONSE_GROUP,
)

const rootClasses = computed(() => {
  const classes = ['lifecycle-view-node']

  switch (props.data.type) {
    case LifecycleNodeType.REQUEST_GROUP:
      classes.push('type-request-group')
      break
    case LifecycleNodeType.RESPONSE_GROUP:
      classes.push('type-response-group')
      break
    default:
      classes.push(`type-${props.data.type}`)
      break
  }

  if (isGroupNode.value) {
    props.data.labelPlacement?.split(' ').forEach((placement) =>
      classes.push(`label-${placement}`),
    )
  }

  return classes
})

const nodeStripeColor = computed(() => getNodeStripeColor(props.data.durationNano))
</script>

<style lang="scss" scoped>
.handle {
  background: $kui-color-background-neutral !important;
  border: none !important;
  z-index: -1;
}

.lifecycle-view-node {
  $stripe-width: 8px;

  align-items: center;
  background-color: $kui-color-background;
  /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
  border: $kui-border-width-10 solid $kui-color-background-neutral-stronger;
  border-radius: $kui-border-radius-30;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  padding: $kui-space-40;
  position: relative;
  width: 100%;

  &.type-request-group {
    background-color: $kui-color-background-primary-weakest;
    border: $kui-border-width-10 solid $kui-color-border-primary;

    .label {
      color: $kui-color-text-primary;
    }
  }

  &.type-response-group {
    background-color: $kui-color-background-decorative-purple-weakest;
    border: $kui-border-width-10 solid $kui-color-border-decorative-purple;

    .label {
      color: $kui-color-text-decorative-purple;
    }
  }

  &.type-request-group,
  &.type-response-group {
    padding: v-bind('`${NODE_GROUP_PADDING}px`');

    .label {
      font-size: $kui-font-size-20;
    }
  }

  &:not(.type-request-group):not(.type-response-group) {
    max-width: 200px;
  }

  &:not(.type-client):not(.type-request-group):not(.type-response-group) {
    padding-left: calc($kui-space-40 + $stripe-width);

    > ::after {
      background-color: v-bind(nodeStripeColor);
      content: '';
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: $stripe-width;
    }
  }

  &.label-top {
    justify-content: flex-start;
    padding-top: v-bind('`${NODE_GROUP_ROW_GAP}px`'); // For visual compensation. Does not affect layout calculation.
  }

  &.label-right {
    align-items: flex-end;
  }

  &.label-bottom {
    justify-content: flex-end;
    padding-bottom: v-bind('`${NODE_GROUP_ROW_GAP}px`'); // For visual compensation. Does not affect layout calculation.
  }

  &.label-left {
    align-items: flex-start;
  }

  .badge {
    margin-bottom: $kui-space-20;
    padding: $kui-space-10 $kui-space-20;
  }

  .label,
  .duration {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-10;
  }

  .label {
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
  }

  .duration {
    font-size: $kui-font-size-20;
  }

  :deep(.popover-trigger-wrapper) {
    cursor: pointer;
  }

  :deep(.k-tooltip) {
    max-width: 200px;
  }
}
</style>
