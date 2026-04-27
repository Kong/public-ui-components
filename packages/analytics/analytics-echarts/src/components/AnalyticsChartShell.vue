<template>
  <div
    class="analytics-chart-shell"
    :class="{
      'show-values': showLegendValues,
    }"
  >
    <div
      v-if="hasValidChartData && resultSetTruncated && maxEntitiesShown"
      class="chart-truncation-warning"
      data-testid="truncation-warning"
    >
      <KTooltip
        class="tooltip"
        max-width="500"
        placement="right"
      >
        <WarningIcon
          :color="`var(--kui-color-text-warning, ${KUI_COLOR_TEXT_WARNING})`"
          :size="KUI_ICON_SIZE_40"
        />
        <template #content>
          <div class="tooltip-content">
            {{ i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown }) }}
          </div>
        </template>
      </KTooltip>
    </div>
    <KEmptyState
      v-if="!hasValidChartData"
      :action-button-visible="false"
      class="chart-empty-state"
      data-testid="no-data-in-report"
    >
      <template #title>
        {{ emptyStateTitle || i18n.t('noDataAvailableTitle') }}
      </template>
      <template #default>
        {{ emptyStateDescription || i18n.t('noDataAvailableDescription') }}
      </template>
    </KEmptyState>
    <div
      v-else
      class="analytics-chart-parent"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_WARNING, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'
import composables from '../composables'

const {
  hasValidChartData,
  resultSetTruncated,
  maxEntitiesShown,
  emptyStateTitle,
  emptyStateDescription,
  showLegendValues,
} = defineProps<{
  hasValidChartData: boolean
  resultSetTruncated: boolean
  maxEntitiesShown?: string | number | null
  emptyStateTitle?: string
  emptyStateDescription?: string
  showLegendValues?: boolean
}>()

const { i18n } = composables.useI18n()
</script>

<style lang="scss" scoped>
.analytics-chart-shell {
  border-radius: var(--kui-border-radius-20, 8px);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 100%;

  .analytics-chart-parent {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    width: 100%;
  }

  .chart-empty-state {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    padding: var(--kui-space-70, $kui-space-70)
      var(--kui-space-0, $kui-space-0)
      var(--kui-space-60, $kui-space-60)
      var(--kui-space-0, $kui-space-0);
  }

  .chart-truncation-warning {
    align-items: center;
    background-color: var(--kui-color-background, #fff);
    display: flex;
    justify-content: flex-start;
    left: 0;
    position: absolute;
    top: 0;
    transform: translateX(-4px);
    z-index: 999;
  }

  .tooltip-content {
    max-width: 40ch;
  }
}
</style>
