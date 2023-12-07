<template>
  <div>
    <VueJsonCsv
      :data="rows"
      :fields="fields"
      :labels="headers"
      :name="filename"
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
  rows: CsvData,
  headers: Record<string, string>,
  filename: string,
}>()

const fields = computed(() => Object.keys(props.headers))
</script>
