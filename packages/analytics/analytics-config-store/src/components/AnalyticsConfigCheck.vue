<template>
  <slot
    v-if="!loading && passThrough"
    :has-analytics="hasAnalytics"
    :has-percentiles="hasPercentiles"
  />
  <slot
    v-else-if="!loading"
    :has-analytics="hasAnalytics"
    :has-percentiles="hasPercentiles"
    name="fallback"
  />
</template>
<script setup lang="ts">
import { type ConfigStoreState, useAnalyticsConfigStore } from '../stores'
import { computed, type Ref } from 'vue'

const props = defineProps<{
  requireAnalytics?: boolean
  requirePercentiles?: boolean
}>()

const analyticsConfigStore = useAnalyticsConfigStore()
const analyticsConfig: Ref<ConfigStoreState> = analyticsConfigStore.getConfig()

const loading = computed<boolean>(() => !analyticsConfig.value)
const hasAnalytics = computed<boolean>(() => !!analyticsConfig.value && analyticsConfig.value.analytics)
const hasPercentiles = computed<boolean>(() => !!analyticsConfig.value && analyticsConfig.value.analytics && analyticsConfig.value.percentiles)
const passThrough = computed<boolean>(() =>
  (props.requireAnalytics ? hasAnalytics.value : true) &&
  (props.requirePercentiles ? hasPercentiles.value : true),
)

</script>
