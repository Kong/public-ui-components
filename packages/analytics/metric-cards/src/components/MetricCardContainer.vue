<template>
  <div class="kong-ui-public-metric-cards">
    <div
      v-if="containerError"
      class="error"
    >
      <KIcon
        class="error-icon"
        icon="warning"
        size="32"
      />
      <div class="error-display">
        <div class="error-display-title">
          {{ containerError }}
        </div>
        <div
          v-if="containerErrorMessage"
          class="error-display-message"
        >
          {{ containerErrorMessage }}
        </div>
      </div>
    </div>
    <template
      v-for="(card, index) in cards"
      v-else
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
        :tooltip="card.tooltip"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import approxNum from 'approximate-number'
import { MetricCardSize, MetricsCardDef } from '../types'
import { changePolarity, metricChange, defineIcon } from '../utilities'
import { KIcon } from '@kong/kongponents'
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
  containerError: {
    type: String,
    required: false,
    default: '',
  },
  containerErrorMessage: {
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

  @media (max-width: ($viewport-md - 1px)) {
    @include flex-gap(16px, 16px);
    flex-direction: column;
  }

  .error {
    align-items: center;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: auto;

    &-icon {
      display: flex;
    }

    &-display {
      display: flex;
      flex-direction: column;
      margin-left: 32px;

      &-title {
        font-size: $font-size-xl;
        font-weight: 600;
        line-height: 24px;
        margin-bottom: 10px;
      }

      &-message {
        color: $color-grey-dark;
        font-size: $font-size-sm;
        font-weight: normal;
        line-height: 20px;
      }
    }

  }
}
</style>
