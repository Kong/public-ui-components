<template>
  <div
    class="legend"
  >
    <div
      v-if="metric"
      class="legend-title"
    >
      {{ title }}
    </div>
    <div
      v-for="(color, index) in data"
      :key="index"
      class="legend-item"
    >
      <span
        class="legend-color"
        :style="{ backgroundColor: color.color }"
      />
      <span class="legend-text">{{ color.range }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'

const {
  metric,
  title,
  data,
} = defineProps<{
  metric: ExploreAggregations
  title: string
  data: Array<{ color: string, range: string }>
}>()

</script>

<style scoped lang="scss">
.legend {
  background: white;
  border: 1px solid var(--kui-color-border, $kui-color-border);
  display: flex;
  flex-direction: column;
  padding: var(--kui-space-30, $kui-space-30);
  position: absolute;

  .legend-title {
    font-size: var(--kui-font-size-10, $kui-font-size-10);
    margin-bottom: var(--kui-space-20, $kui-space-20);
  }

  .legend-item {
    align-items: center;
    display: flex;
    line-height: var(--kui-line-height-10, $kui-line-height-10);
  }

  .legend-item:not(:last-child) {
    margin-bottom: var(--kui-space-20, $kui-space-20);
  }

  .legend-color {
    border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
    height: 10px;
    margin-right: var(--kui-space-30, $kui-space-30);
    width: 10px;
  }

  .legend-text {
    font-size: var(--kui-font-size-10, $kui-font-size-10);
  }
}
</style>
