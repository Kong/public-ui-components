<template>
  <div class="waterfall-legend">
    <div class="title">
      {{ t('waterfall.legend.latency') }}
    </div>
    <div
      v-for="(legendItem, legendItemKind) in WATERFALL_LEGENDS"
      :key="legendItemKind"
      class="legend-item"
    >
      <div
        class="color"
        :style="{ backgroundColor: legendItem.color }"
      />
      <div>{{ t(`waterfall.legend.labels.${legendItemKind}`) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../../composables'
import { WATERFALL_LEGENDS } from '../../constants'

const { i18n: { t } } = composables.useI18n()
</script>

<style lang="scss" scoped>
.waterfall-legend {
  align-items: center;
  display: flex;
  flex-direction: row;
  font-size: $kui-font-size-30;
  gap: $kui-space-40;
  justify-content: flex-start;

  .title {
    font-weight: $kui-font-weight-semibold;
  }

  .legend-item {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-20;
    justify-content: flex-start;

    .color {
      height: 10px;
      width: 10px;
    }
  }
}
</style>
