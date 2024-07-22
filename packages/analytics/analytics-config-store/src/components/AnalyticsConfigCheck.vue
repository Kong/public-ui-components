<template>
  <slot
    :has-analytics="analytics"
    :has-percentiles="percentiles"
    :name="!loading && passThrough ? '' : 'fallback'"
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
const { analytics, percentiles, loading } = storeToRefs(analyticsConfigStore)

const passThrough = computed<boolean>(() =>
  (props.requireAnalytics ? analytics.value : true) &&
  (props.requirePercentiles ? percentiles.value : true),
)

</script>
