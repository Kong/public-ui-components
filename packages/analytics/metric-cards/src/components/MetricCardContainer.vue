<template>
  <div
    class="kong-ui-public-metric-card-container"
    :class="cardSize"
  >
    <div
      v-if="allCardsHaveErrors"
      class="error-display"
    >
      <KIcon
        class="error-display-icon"
        icon="warning"
        size="24"
      />
      <div
        v-if="errorMessage"
        class="error-display-message"
      >
        {{ errorMessage }}
      </div>
    </div>
    <template
      v-for="(card, index) in cards"
      v-else
    >
      <MetricCardLoadingSkeleton
        v-if="loading"
        :key="`skeleton-${index}`"
        :class="cardSize === MetricCardSize.Small ? 'loading-tabs-small' : 'loading-tabs-large'"
      />
      <MetricsCard
        v-else
        :key="index"
        v-bind="formatCardValues(card)"
        :card-size="cardSize"
        :card-type="card.cardType"
        :error-message="errorMessage"
        :has-error="card.hasError"
        :title="card.title"
        :tooltip="card.tooltip"
        :trend-range="card.trendRange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import approxNum from 'approximate-number'
import { MetricCardSize } from '../enums'
import type { MetricCardDef, MetricCardDisplayValue } from '../types'
import { changePolarity, metricChange, defineIcon, calculateChange } from '../utilities'
import MetricsCard from './display/MetricsCard.vue'
import MetricCardLoadingSkeleton from './display/MetricCardLoadingSkeleton.vue'

const props = defineProps({
  fallbackDisplayText: {
    type: String,
    required: true,
  },
  cards: {
    type: Array as PropType<MetricCardDef[]>,
    required: true,
  },
  errorMessage: {
    type: String,
    required: false,
    default: '',
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  hasTrendAccess: {
    type: Boolean,
    required: false,
    default: true,
  },
  cardSize: {
    type: String as PropType<MetricCardSize>,
    required: false,
    default: () => MetricCardSize.Large,
  },
})

const allCardsHaveErrors = computed((): boolean => props.cards.every(val => val?.hasError === true))

const formatCardValues = (card: MetricCardDef): MetricCardDisplayValue => {
  const change = calculateChange(card.currentValue, card.previousValue) || 0
  const polarity = changePolarity(change, props.hasTrendAccess, card.increaseIsBad)

  return {
    // type: card.cardType,
    metricValue: card.formatValueFn ? card.formatValueFn(card.currentValue) : approxNum(card.currentValue, { capital: true, round: true }) || '0',
    metricChange: card.formatChangeFn ? card.formatChangeFn(change) : metricChange(change, props.hasTrendAccess, props.fallbackDisplayText),
    changePolarity: polarity,
    trendIcon: defineIcon(polarity, card.increaseIsBad) as any,
    cardSize: props.cardSize,
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/base";

.kong-ui-public-metric-card-container {
  background-color: var(--kong-ui-metric-card-background, transparent);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  @include flex-gap(24px, 16px);

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    @include flex-gap(16px, 16px);
    flex-direction: column;
  }

  // Ensure tightest possible spacing
  &.sm {
    @include flex-gap(0, 0);
  }

  .error-display {
    align-items: center;
    display: flex;
    justify-content: center;
    margin: $kui-space-auto;

    &-icon {
      display: flex;
    }

    &-message {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-30;
      margin-left: $kui-space-50;
    }
  }
}
</style>
