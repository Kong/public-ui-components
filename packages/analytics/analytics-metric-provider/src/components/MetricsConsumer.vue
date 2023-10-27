<template>
  <slot :card-values="cardValues">
    <MetricCardContainer
      v-bind="containerOpts"
    />
  </slot>
</template>
<script setup lang="ts">
import type { Ref } from 'vue'
import { inject, computed } from 'vue'
import { METRICS_PROVIDER_KEY } from './metricsProviderUtil'
import type { MetricCardDef } from '@kong-ui-public/metric-cards'
import { MetricCardSize, MetricCardType, DECIMAL_DISPLAY, MetricCardContainer } from '@kong-ui-public/metric-cards'
import '@kong-ui-public/metric-cards/dist/style.css'
import composables from '../composables'
import { ALL_STATUS_CODE_GROUPS, STATUS_CODES_FAILED } from '../constants'
import { sumValues } from '../composables/useMetricCardBuilder'

type CardToDisplay = 'TRAFFIC' | 'ERROR_RATE' | 'LATENCY'

const props = withDefaults(defineProps<{
  lookupKey?: string
  cardSize?: MetricCardSize
  cardToDisplay?: CardToDisplay
}>(), {
  lookupKey: undefined,
  cardSize: MetricCardSize.Large,
  cardToDisplay: undefined,
})

const providerData = inject(METRICS_PROVIDER_KEY)

if (!providerData) {
  throw new Error('MetricsConsumer must be nested inside a MetricsProvider instance.')
}

const { traffic, latency } = providerData.data

const { i18n } = composables.useI18n()

const trafficCard = composables.useMetricCardBuilder({
  cardType: MetricCardType.TRAFFIC,
  title: computed(() => providerData.longCardTitles
    ? i18n.t('metricCard.long.traffic')
    : i18n.t('metricCard.short.traffic')),
  description: providerData.description,
  record: traffic.mapped,
  hasError: traffic.hasError,
  lookupKey: props.lookupKey,
  sumGroupedValues: ALL_STATUS_CODE_GROUPS,
  trendRange: providerData.trendRange,
})

// Error rate (special case, requires operation)
// TODO: provide a error rate aggregation in explore later
// then can use default MetricCardBuilder
const formatErrorRate = (val: number) => `${val.toFixed(DECIMAL_DISPLAY)}%`
const errorRateCard = computed<MetricCardDef>(() => {
  const record = traffic.mapped.value

  const currentErrors = sumValues(record, 'current', props.lookupKey, STATUS_CODES_FAILED)
  const currentTotal = sumValues(record, 'current', props.lookupKey, ALL_STATUS_CODE_GROUPS)
  const errorRateCurrent = currentErrors / currentTotal * 100 || 0

  const previousErrors = sumValues(record, 'previous', props.lookupKey, STATUS_CODES_FAILED)
  const previousTotal = sumValues(record, 'previous', props.lookupKey, ALL_STATUS_CODE_GROUPS)
  const errorRatePrevious = previousErrors / previousTotal * 100 || 0

  return {
    cardType: MetricCardType.ERROR_RATE,
    hasError: traffic.hasError.value,
    currentValue: errorRateCurrent,
    previousValue: errorRatePrevious,
    formatValueFn: formatErrorRate,
    title: providerData.longCardTitles
      ? i18n.t('metricCard.long.errorRate')
      : i18n.t('metricCard.short.errorRate'),
    description: providerData.description,
    increaseIsBad: true,
    trendRange: providerData.trendRange.value,
  }
})

const formatLatency = (val: number) => `${val}ms`
const latencyCard = composables.useMetricCardBuilder({
  cardType: MetricCardType.LATENCY,
  title: computed(() => providerData.longCardTitles
    ? i18n.t('metricCard.long.latency')
    : i18n.t('metricCard.short.latency')),
  description: providerData.description,
  hasError: latency.hasError,
  record: latency.mapped,
  lookupKey: props.lookupKey,
  increaseIsBad: true,
  formatValueFn: formatLatency,
  trendRange: providerData.trendRange,
})

const cards: Ref<MetricCardDef[]> = computed(() => {
  if (props.cardToDisplay === 'TRAFFIC') {
    return [trafficCard.value]
  } else if (props.cardToDisplay === 'ERROR_RATE') {
    return [errorRateCard.value]
  } else if (props.cardToDisplay === 'LATENCY') {
    return [latencyCard.value]
  }

  return [trafficCard.value, errorRateCard.value, latencyCard.value]
})

const isLoading = computed<boolean>(() => {
  if (props.cardToDisplay === 'TRAFFIC' || props.cardToDisplay === 'ERROR_RATE') {
    return traffic.isLoading.value
  } else if (props.cardToDisplay === 'LATENCY') {
    return latency.isLoading.value
  }

  return traffic.isLoading.value || latency.isLoading.value
})

// TODO: per-card loading?
const containerOpts = computed(() => ({
  cards: cards.value,
  loading: isLoading.value,
  hasTrendAccess: providerData.hasTrendAccess,
  fallbackDisplayText: i18n.t('general.notAvailable'),
  cardSize: props.cardSize,
  hideTitle: true,
  trendRange: providerData.trendRange.value,
}))

const cardValues = computed(() => ({
  loading: containerOpts.value.loading,
  trafficCard: trafficCard.value,
  errorRateCard: errorRateCard.value,
  latencyCard: latencyCard.value,
  errorRateFormatted: formatErrorRate(errorRateCard.value.currentValue),
  latencyFormatted: formatLatency(latencyCard.value.currentValue),
}))

</script>
