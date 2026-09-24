<script setup lang="ts">
import type { TopTalkersCellData } from '../../types/top-talkers'

import { KPop } from '@kong/kongponents'

defineProps<{
  cell: TopTalkersCellData
}>()
</script>

<template>
  <KPop
    class="top-talkers-cell-wrapper"
    :disabled="!cell.tooltipRows.length"
    hide-caret
    hide-close-icon
    placement="right"
    :popover-timeout="0"
    :style="{ flexGrow: cell.ratio }"
    trigger="hover"
  >
    <div
      class="top-talkers-cell"
      :class="{
        'top-talkers-cell--other': cell.isOther,
        'top-talkers-cell--empty': cell.isEmpty,
        'top-talkers-cell--deleted': cell.deleted,
      }"
      data-testid="top-talkers-cell"
      :data-value="cell.id"
    >
      <span
        class="top-talkers-cell-name"
        data-testid="top-talkers-cell-name"
        :title="cell.name"
      >{{ cell.name }}</span>
      <span class="top-talkers-cell-metric">
        <span
          class="top-talkers-cell-value"
          data-testid="top-talkers-cell-value"
        >{{ cell.display }}</span>
        <span
          v-if="cell.relative"
          class="top-talkers-cell-relative"
          data-testid="top-talkers-cell-relative"
        >({{ cell.relative }})</span>
      </span>
    </div>

    <template #content>
      <div
        class="top-talkers-tooltip"
        data-testid="top-talkers-tooltip"
      >
        <div class="top-talkers-tooltip-title">
          {{ cell.name }}
        </div>
        <dl class="top-talkers-tooltip-rows">
          <template
            v-for="row in cell.tooltipRows"
            :key="row.key"
          >
            <dt class="top-talkers-tooltip-label">
              {{ row.label }}
            </dt>
            <dd
              class="top-talkers-tooltip-value"
              :class="row.threshold && `top-talkers-tooltip-value--${row.threshold}`"
              :data-threshold="row.threshold"
            >
              {{ row.value }}
            </dd>
          </template>
        </dl>
      </div>
    </template>
  </KPop>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.top-talkers-cell-wrapper {
  display: flex;
  flex-basis: 0;
  min-height: 32px;
  min-width: 0;

  :deep(.popover-trigger-wrapper) {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
  }
}

.top-talkers-cell {
  align-items: flex-start;
  background-color: color-mix(in srgb, v-bind('cell.color') v-bind('cell.tint'), var(--kui-color-background, $kui-color-background));
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kui-color-text, $kui-color-text);
  display: flex;
  flex: 1 1 auto;
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: space-between;
  min-width: 0;
  padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
  width: 100%;

  &--other,
  &--empty {
    background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
  }

  &--empty &-name {
    font-style: italic;
  }

  &--deleted &-name {
    font-style: italic;
  }

  &-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-metric {
    align-items: baseline;
    display: inline-flex;
    flex-shrink: 0;
    font-feature-settings: 'case';
    font-variant-numeric: tabular-nums;
    gap: var(--kui-space-20, $kui-space-20);
  }

  &-value {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &-relative {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}

.top-talkers-tooltip {
  &-title {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  &-rows {
    column-gap: var(--kui-space-80, $kui-space-80);
    display: grid;
    grid-template-columns: auto auto;
    margin: 0;
    row-gap: var(--kui-space-20, $kui-space-20);
  }

  &-label {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }

  &-value {
    font-variant-numeric: tabular-nums;
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    margin: 0;
    text-align: right;

    &--warning {
      color: var(--kui-color-text-warning, $kui-color-text-warning);
    }

    &--error {
      color: var(--kui-color-text-danger, $kui-color-text-danger);
    }
  }
}
</style>
