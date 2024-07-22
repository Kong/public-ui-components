<template>
  <slot />
</template>
<script setup lang="ts">
import type { AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { provide } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../src/constants'

const props = defineProps<{
  queryBridge: AnalyticsBridge
}>()

provide(INJECT_QUERY_PROVIDER, props.queryBridge)
</script>
