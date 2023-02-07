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
        :has-error="error"
        :subtitle="card.subtitle"
        :title="hideTitle? '' : card.title"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import approxNum from 'approximate-number'
import { MetricCardSize, MetricsCardDef } from '../types'
import { changePolarity, metricChange, defineIcon } from './cardUtils'
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
  error: {
    type: Boolean,
    required: false,
    default: false,
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
  hideTitle: {
    type: Boolean,
    required: false,
    default: false,
  },
  cardSize: {
    type: String as PropType<MetricCardSize>,
    required: false,
    default: () => 'lg',
  },
})

const calculateDelta = (curr: number, prev: number) => {
  return curr / prev - 1
}

function formatCardValues(card: MetricsCardDef) {
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
  background-color: #fff;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  @include flex-gap();

  @media (max-width: $viewport-sm) {
    flex-direction: column;
  }
}
</style>
