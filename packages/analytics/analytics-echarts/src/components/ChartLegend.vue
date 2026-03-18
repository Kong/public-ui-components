<template>
  <ul
    v-if="position !== 'hidden' && items.length"
    class="legend-container"
    data-testid="legend"
  >
    <li
      v-for="item in items"
      :key="item.label"
      @click="emit('toggle', item.label)"
    >
      <div
        class="square-marker"
        :style="{ background: item.color, borderColor: item.borderColor }"
      />
      <KTooltip>
        <div
          class="label-container"
          :class="{ 'strike-through': item.hidden }"
          :title="item.value && showValues ? `${item.label}: ${item.value.formatted}` : item.label"
        >
          <div class="label truncate-label">
            {{ item.label }}
          </div>
          <div
            v-if="item.value && showValues"
            class="sub-label"
          >
            {{ item.value.formatted }}
          </div>
        </div>
        <template
          v-if="item.isSegmentEmpty"
          #content
        >
          <div class="tooltip-content">
            {{ i18n.t('emptyEntityInfo') }}
          </div>
        </template>
      </KTooltip>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ChartLegendItem, LegendPosition } from '../types'
import composables from '../composables'

withDefaults(defineProps<{
  items: ChartLegendItem[]
  position?: LegendPosition
  showValues?: boolean
}>(), {
  position: 'bottom',
  showValues: false,
})

const emit = defineEmits<{
  (e: 'toggle', label: string): void
}>()

const { i18n } = composables.useI18n()
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;
@use "../styles/mixins.scss" as *;

.legend-container {
  box-sizing: border-box;
  display: flex;
  flex-grow: 1;
  flex-wrap: wrap;
  gap: 8px 9px;
  justify-content: center;
  list-style: none;
  margin: 0;
  max-height: inherit;
  overflow: auto;
  -ms-overflow-style: thin;
  padding: $kui-space-40 calc(5% + $kui-space-20);
  width: 100%;

  & {
    @include scrollbarBase;
  }

  li {
    align-items: center;
    cursor: pointer;
    display: flex;
    line-height: 1;
    margin: 0;
  }

  .square-marker {
    border: 1px solid transparent;
    height: 8px;
    margin-right: $kui-space-30;
    width: 8px;
  }

  .label {
    font-size: $kui-font-size-20;
    white-space: nowrap;
  }

  .truncate-label {
    max-width: 20ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sub-label {
    font-size: $kui-font-size-20;
    line-height: $kui-line-height-20;
    word-break: normal;
  }

  .strike-through {
    text-decoration: line-through;
  }

  .tooltip-content {
    max-width: 40ch;
  }
}
</style>
