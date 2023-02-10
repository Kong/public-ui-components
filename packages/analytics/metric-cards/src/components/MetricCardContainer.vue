<template>
  <!-- The <div> tag here is just a placeholder for your component content. -->
  <!-- We recommend wrapping your component with a unique class when possible, as shown below. -->
  <div class="kong-ui-public-metric-cards">
    <template
      v-for="(card, index) in cards"
    >
      <MetricCardLoadingSkeleton
        v-if="loading"
        :key="`skeleton-${index}`"
      />
      <MetricsCard
        v-else
        :key="index"
        v-bind="formatCardValues(card)"
        :card-size="cardSize"
        :error-message="card.errorMessage"
        :has-error="card.hasError"
        :title="card.title"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import approxNum from 'approximate-number'
import { MetricCardSize, MetricsCardDef } from '../types'
import { changePolarity, metricChange, defineIcon } from '../utilities'
import MetricsCard from './display/MetricsCard.vue'
import MetricCardLoadingSkeleton from './display/MetricCardLoadingSkeleton.vue'

const props = defineProps({
  fallbackDisplayText: {
    type: String,
    required: true,
  },
  cards: {
    type: Array as PropType<MetricsCardDef[]>,
    required: true,
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

const calculateDelta = (curr: number, prev: number) => {
  return curr / prev - 1
}

const formatCardValues = (card: MetricsCardDef) => {
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

.kong-ui-public-metric-cards {
  background-color: transparent;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  @include flex-gap(24px, 16px);

  @media (max-width: $viewport-lg) {
    @include flex-gap(12px, 16px);
  }
  @media (max-width: $viewport-md) {
    flex-direction: column;
  }
}
</style>
