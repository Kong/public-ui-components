<template>
  <div class="lifecycle-view-legend">
    <div
      v-for="item in legendItems"
      :key="item.label"
      class="legend-item"
    >
      <div
        class="color"
        :style="{ backgroundColor: item.color }"
      />
      <div>{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_BACKGROUND_PRIMARY_WEAK, KUI_COLOR_BACKGROUND_PRIMARY_WEAKER, KUI_COLOR_BACKGROUND_PRIMARY_WEAKEST } from '@kong/design-tokens'

const legendItems = [
  { color: KUI_COLOR_BACKGROUND_PRIMARY_WEAKEST, label: '0-1ms' },
  { color: KUI_COLOR_BACKGROUND_PRIMARY_WEAKER, label: '2-10ms' },
  { color: KUI_COLOR_BACKGROUND_PRIMARY_WEAK, label: '11-50ms' },
]
</script>

<style lang="scss" scoped>
.lifecycle-view-legend {
  align-items: center;
  background-color: $kui-color-background;
  bottom: 8px; // = $kui-space-40 but stylelint complains about it
  box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-shrink: 0;
  font-size: $kui-font-size-30;
  gap: $kui-space-40;
  justify-content: flex-start;
  left: 50%;
  padding: $kui-space-20 $kui-space-30;
  position: absolute;
  transform: translateX(-50%);
  z-index: 1000;

  .title {
    font-weight: $kui-font-weight-semibold;
  }

  .legend-item {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-30;
    justify-content: flex-start;

    .color {
      border: $kui-border-width-10 solid $kui-color-border-neutral-weak;
      border-radius: $kui-border-radius-10;
      height: 10px;
      width: 10px;
    }
  }
}
</style>
