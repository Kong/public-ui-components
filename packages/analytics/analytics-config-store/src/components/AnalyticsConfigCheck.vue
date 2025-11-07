<template>
  <slot
    v-if="!loading && configError"
    :error="configError"
    name="error"
  />
  <slot
    v-else-if="!loading && passThrough"
    :has-analytics="analytics"
    :has-percentiles="percentiles"
  />
  <slot
    v-else-if="!loading"
    :has-analytics="analytics"
    :has-percentiles="percentiles"
    name="fallback"
  />
</template>
<script setup lang="ts">
import { useAnalyticsConfigStore } from '../stores'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  requireAnalytics?: boolean
  requirePercentiles?: boolean
}>()

const analyticsConfigStore = useAnalyticsConfigStore()
const { analytics, percentiles, configError, loading } = storeToRefs(analyticsConfigStore)

const passThrough = computed<boolean>(() =>
  (props.requireAnalytics ? analytics.value : true) &&
  (props.requirePercentiles ? percentiles.value : true),
)

</script>
