<template>
  <div class="kong-ui-public-echarts-tooltip">
    <div class="tooltip-title">
      <div class="title">
        {{ title }}
      </div>
      <div
        v-if="context || metric"
        class="subtitle"
      >
        <div class="context">
          {{ context }}
        </div>
        <div class="metric">
          {{ metric }}
        </div>
      </div>
    </div>
    <ul class="tooltip-rows">
      <li
        v-for="(row, index) in rows"
        :key="`${row.label}-${index}`"
      >
        <span
          class="square-marker"
          :style="{ background: row.color }"
        />
        <span class="display-label">{{ row.label }}</span>
        <span class="display-value">{{ row.value }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ChartTooltipProps } from '../types/index.ts'

// Same look as the analytics-chart tooltip: a title, an optional
// context/metric subtitle, and a row per value with a color marker
const { title = '', context, metric, rows = [] } = defineProps<ChartTooltipProps>()
</script>

<style lang="scss" scoped>
.kong-ui-public-echarts-tooltip {
  color: var(--kui-color-text, $kui-color-text);
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  max-width: 425px;

  .tooltip-title {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-direction: column;
    margin: var(--kui-space-30, $kui-space-30) var(--kui-space-30, $kui-space-30) 0;
    min-height: 24px;
    padding-bottom: var(--kui-space-20, $kui-space-20);

    .title {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }

    .subtitle {
      display: flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      gap: var(--kui-space-40, $kui-space-40);
      justify-content: space-between;
      margin-top: var(--kui-space-30, $kui-space-30);
    }
  }

  .tooltip-rows {
    list-style: none;
    margin: var(--kui-space-30, $kui-space-30);
    max-height: 300px;
    min-width: 250px;
    overflow-y: auto;
    padding-left: var(--kui-space-0, $kui-space-0);

    li {
      align-items: center;
      display: flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
    }

    .square-marker {
      display: inline-flex;
      flex-shrink: 0;
      height: 12px;
      margin-right: var(--kui-space-30, $kui-space-30);
      width: 12px;
    }

    .display-label {
      flex: 1;
      max-width: 75%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .display-value {
      font-variant-numeric: tabular-nums;
      margin-left: auto;
      padding-left: var(--kui-space-40, $kui-space-40);
      white-space: nowrap;
    }
  }
}
</style>
