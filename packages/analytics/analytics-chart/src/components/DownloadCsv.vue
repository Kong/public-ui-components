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
import VueJsonCsv from './VueJsonCsv.vue'

const props = defineProps<{
  rows: any[],
  headers: Record<string, string>,
  filename: string,
}>()

const fields = computed(() => Object.keys(props.headers))
</script>
