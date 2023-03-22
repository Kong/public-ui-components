<template>
  <div class="sandbox-container">
    <main>
      <h3>Small</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsSmall"
          hide-title
        />
      </div>

      <h3>Large</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsRegular"
          hide-title
        />
      </div>

      <h3>Large w/ custom theme</h3>
      <div class="generic-card dev-portal">
        <MetricCardContainer v-bind="cardsRegular" />
      </div>

      <h3>Extra Large</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsXL"
          hide-title
        />
      </div>

      <h3>Loading</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsLoading"
          hide-title
        />
      </div>

      <h3>Not Available</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsNotAvailable"
          hide-title
        />
      </div>

      <h3>Errors (partial)</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsErrors"
          hide-title
        />
      </div>

      <h3>Errors (across all cards)</h3>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="cardsErrorsAll"
          hide-title
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { MetricCardContainer } from '../src'
import { DECIMAL_DISPLAY, metricChange } from '../src/utilities'
import { MetricCardContainerOptions } from '../src/types'
import { MetricCardSize } from '../src/constants'

const cards = [
  {
    currentValue: 192895156,
    previousValue: 236609609,
    title: 'Requests',
    tooltip: 'This is a tooltip',
    increaseIsBad: false,
  },
  {
    currentValue: 30.1448979685401,
    previousValue: 30.1891166494617,
    formatChangeFn: val => `${metricChange(val * 100, true, 'N/A')}`,
    formatValueFn: val => `${val.toFixed(DECIMAL_DISPLAY)}%`,
    title: 'Error Rate',
    increaseIsBad: true,
  },
  {
    currentValue: 335,
    previousValue: 511,
    formatValueFn: val => `${val}ms`,
    title: 'P99 Latency',
    increaseIsBad: true,
  },
  {
    currentValue: 5,
    previousValue: 4,
    title: 'Active Runtimes',
    increaseIsBad: true,
  },
  {
    currentValue: 67.323232,
    previousValue: 23.2121,
    formatValueFn: val => `${val.toFixed(0)}%`,
    title: 'Saturation',
    tooltip: 'A secondary tooltip',
    increaseIsBad: true,
  },
]

const cardsWithErrors = JSON.parse(JSON.stringify(cards))
cardsWithErrors[0].hasError = true
cardsWithErrors[1].hasError = true
cardsWithErrors[2].hasError = true

const cardsSmall: MetricCardContainerOptions = {
  cards,
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
  cardSize: MetricCardSize.Small,
}

const cardsRegular: MetricCardContainerOptions = {
  cards: [...cards].slice(0, 3),
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
  cardSize: MetricCardSize.Large,
}

const cardsXL: MetricCardContainerOptions = {
  cards: [...cards].slice(0, 3),
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
  cardSize: MetricCardSize.ExtraLarge,
}

const cardsLoading: MetricCardContainerOptions = {
  cards: [...cards].slice(0, 3),
  loading: true,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
}

const cardsNotAvailable: MetricCardContainerOptions = {
  cards: [...cards].slice(0, 3),
  loading: false,
  hasTrendAccess: false,
  fallbackDisplayText: '-.--%',
  cardSize: MetricCardSize.Large,
}

const cardsErrors: MetricCardContainerOptions = {
  cards: [...cardsWithErrors].slice(0, 4),
  loading: false,
  hasTrendAccess: true,
  errorMessage: 'An error occurred',
  fallbackDisplayText: 'Not available',
}

const cardsErrorsAll: MetricCardContainerOptions = {
  cards: [...cardsWithErrors].slice(0, 3),
  loading: false,
  hasTrendAccess: false,
  errorMessage: 'Analytics cannot be displayed due to an error.',
  fallbackDisplayText: 'Not available',
}
</script>

<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #f1f1f5;
  min-height: 100%;
}

main {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 32px;

  h3 {
    color: #b6b6b6;
  }

  .generic-card {
    background-color: white;
    display: flex;
    margin-bottom: 16px;
    padding: 16px;

    &.dev-portal {
      background-color: #555;

      // Customizable theme
      --kong-ui-metric-card-background: #555;
      --kong-ui-metric-card-title: #ccc;
      --kong-ui-metric-card-value: white;
      --kong-ui-metric-card-trend-negative: #c59fff;
      --kong-ui-metric-card-trend-positive: #cfff56;
    }
  }
}
</style>
