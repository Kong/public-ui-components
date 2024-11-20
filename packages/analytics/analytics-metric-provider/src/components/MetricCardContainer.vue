<template>
  <div
    class="kong-ui-public-metric-card-container"
    :class="cardSize"
  >
    <div
      v-if="props.containerTitle || props.containerDescription"
      class="container-title"
    >
      {{ props.containerTitle }}
      <div
        v-if="props.containerDescription"
        class="container-description"
      >
        {{ props.containerDescription }}
      </div>
    </div>
    <div
      v-if="allCardsHaveErrors"
      class="error-display"
    >
      <WarningIcon class="error-display-icon" />
      <div
        v-if="errorMessage"
        class="error-display-message"
      >
        {{ errorMessage }}
      </div>
    </div>
    <div
      v-else
      class="cards-wrapper"
    >
      <template v-for="(card, index) in cards">
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
          :description="card.description"
          :error-message="errorMessage"
          :has-error="card.hasError"
          :title="card.title"
          :title-tag="card.titleTag"
          :tooltip="card.tooltip"
          :trend-range="card.trendRange"
        />
      </template>
    </div>
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
import { WarningIcon } from '@kong/icons'

// Import any one of the `@kong/icons` components to access the interface - they are all the same.
// Then alias as `GenericIcon` to provide the icon interface to the prop types.
import type { KongIcon as GenericIcon } from '@kong/icons'

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
  containerTitle: {
    type: String,
    required: false,
    default: '',
  },
  containerDescription: {
    type: String,
    required: false,
    default: '',
  },
})

const allCardsHaveErrors = computed((): boolean => props.cards.every(val => val?.hasError === true))

const formatCardValues = (card: MetricCardDef): MetricCardDisplayValue => {
  const change = calculateChange(card.currentValue, card.previousValue) || 0
  const polarity = changePolarity(change, props.hasTrendAccess, card.increaseIsBad)

  return {
    metricValue: card.formatValueFn ? card.formatValueFn(card.currentValue) : approxNum(card.currentValue, { capital: true, round: true }) || '0',
    metricChange: card.formatChangeFn ? card.formatChangeFn(change) : metricChange(change, props.hasTrendAccess, props.fallbackDisplayText),
    changePolarity: polarity,
    trendIcon: defineIcon(polarity, card.increaseIsBad) as typeof GenericIcon,
    cardSize: props.cardSize,
    hasContainerTitle: !!props.containerTitle,
  }
}
</script>

<style lang="scss" scoped>
@use "../styles/globals" as *;

.kong-ui-public-metric-card-container {
  background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;

  .container-title {
    align-items: center;
    display: flex;
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    justify-content: space-between;
    margin-bottom: var(--kui-space-50, $kui-space-50);

    .container-description {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    }
  }

  .cards-wrapper {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    @include flex-gap(24px, 16px);

    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      @include flex-gap(16px, 16px);
      flex-direction: column;
    }
  }

  // Ensure tightest possible spacing
  &.sm {
    @include flex-gap(0, 0);
  }

  .error-display {
    align-items: center;
    display: flex;
    justify-content: center;
    margin: var(--kui-space-auto, $kui-space-auto);

    &-icon {
      display: flex;
    }

    &-message {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      margin-left: var(--kui-space-50, $kui-space-50);
    }
  }
}
</style>
