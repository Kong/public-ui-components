<template>
  <div class="sandbox-container">
    <main>
      <div class="generic-card">
        <MetricCardContainer
          v-bind="metricCardOptions"
          hide-title
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { MetricCardContainer } from '../src'
import { DECIMAL_DISPLAY } from '../src/utilities'

const metricCardOptions = {
  cards: [
    {
      currentValue: 192895156,
      previousValue: 236609609,
      title: 'Number of Requests',
      increaseIsBad: false,
      cardSize: 'lg',
    },
    {
      currentValue: 31.076361502825918,
      previousValue: 30.59477013885772,
      formatValueFn: val => `${val.toFixed(DECIMAL_DISPLAY)}%`,
      title: 'Average Error Rate',
      increaseIsBad: true,
      cardSize: 'lg',
    },
    {
      currentValue: 335,
      previousValue: 511,
      formatValueFn: val => `${val}ms`,
      title: 'P99 Latency',
      increaseIsBad: true,
      cardSize: 'lg',
    },
    {
      currentValue: 5,
      previousValue: 4,
      title: 'Active Runtimes',
      increaseIsBad: true,
      cardSize: 'lg',
    },
  ],
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
}
</script>

<style lang="scss">
html {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #f1f1f5;
  min-height: 100%;
}

main {
  display: flex;

  .generic-card {
    background-color: white;
    display: flex;
    padding: 1rem;
    width: 100%;
  }
}
</style>
