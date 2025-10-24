<template>
  <div class="map-tooltip">
    <div
      class="map-tooltip-color"
    />
    <div class="map-tooltip-text">
      <div>{{ data.label }}</div>
      <span v-if="showValue">
        {{ data.value }}
      </span>
    </div>
  </div>
</template>
<script lang="ts" setup>

export interface MapTooltipData {
  color: string
  label: string
  value: string
}

const {
  data,
  showValue,
  top,
  left,
} = defineProps<{
  data: MapTooltipData
  showValue: boolean
  top: string
  left: string
}>()
</script>

<style lang="scss" scoped>
.map-tooltip {
  align-items: center;
  background: var(--kui-color-background, $kui-color-background);
  border: 1px solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: inline-flex;
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  gap: var(--kui-space-30, $kui-space-30);
  left: v-bind('left');
  line-height: var(--kui-line-height-20, $kui-line-height-20);
  padding: var(--kui-space-60, $kui-space-60);
  position: absolute;
  top: v-bind('top');
  transform: translate(-50%, calc(-100% - 20px));

  &::after {
    background: var(--kui-color-background, $kui-color-background);
    border-bottom: 1px solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
    border-right: 1px solid var(--kui-color-border, $kui-color-border);
    bottom: -6px;
    content: '';
    height: 10px;
    left: 50%;
    position: absolute;
    transform: translateX(-50%) rotate(45deg);
    width: 10px;
  }


  .map-tooltip-color {
    background-color: v-bind('data.color');
    border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
    height: 16px;
    width: 16px;
  }

  .map-tooltip-text {
    display: flex;
    gap: var(--kui-space-100, $kui-space-100);
    justify-content: space-between;
    white-space: nowrap;
  }
}
</style>
