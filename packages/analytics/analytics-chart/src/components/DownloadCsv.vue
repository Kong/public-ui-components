<!-- TODO: Remove this deprecated analytics-chart CSV export file after consumers migrate to @kong-ui-public/dashboard-renderer. MA-5236: https://konghq.atlassian.net/browse/MA-5236 -->
<template>
  <div>
    <VueJsonCsv
      :data="rows"
      :fields="fields"
      :filename="filename"
      :labels="headers"
    >
      <slot />
    </VueJsonCsv>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CsvData } from '../types'
import VueJsonCsv from './vue-json-csv/VueJsonCsv.vue'

const props = defineProps<{
  rows: CsvData
  headers: Record<string, string>
  filename: string
}>()

const fields = computed(() => Object.keys(props.headers))
</script>
