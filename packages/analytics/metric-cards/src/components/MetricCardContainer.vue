<template>
  <div class="kong-ui-public-metric-card-container">
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
        :error-message="card.errorMessage"
        :has-error="card.hasError"
        :title="card.title"
        :tooltip="card.tooltip"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue'
import approxNum from 'approximate-number'
import { MetricCardSize } from '../constants'
import { MetricCardDef, MetricCardDisplayValue } from '../types'
import { changePolarity, metricChange, defineIcon } from '../utilities'
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

const calculateDelta = (curr: number, prev: number): number => {
  return curr / prev - 1
}

const formatCardValues = (card: MetricCardDef): MetricCardDisplayValue => {
  const change = calculateDelta(card.currentValue, card.previousValue) || 0
  const polarity = changePolarity(change, props.hasTrendAccess, card.increaseIsBad)

  return {
    metricValue: card.formatValueFn ? card.formatValueFn(card.currentValue) : approxNum(card.currentValue, { capital: true }) || '0',
    metricChange: card.formatChangeFn ? card.formatChangeFn(change) : metricChange(change, props.hasTrendAccess, props.fallbackDisplayText),
    changePolarity: polarity,
    icon: defineIcon(polarity, card.increaseIsBad),
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

  @media (max-width: ($viewport-md - 1px)) {
    @include flex-gap(16px, 16px);
    flex-direction: column;
  }

  .error-display {
    align-items: center;
    display: flex;
    justify-content: center;
    margin: auto;

    &-icon {
      display: flex;
    }

    &-message {
      color: $color-grey;
      font-size: $font-size-sm;
      margin-left: 10px;
    }
  }
}
</style>
