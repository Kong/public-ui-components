<template>
  <div>
    <vue-json-csv
      :data="rows"
      :fields="fields"
      :labels="headers"
      :name="filename"
    >
      <slot />
    </vue-json-csv>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// @ts-ignore - Leave in place until this is merged: https://github.com/Belphemur/vue-json-csv/pull/477
import VueJsonCsv from 'vue-json-csv'

const props = defineProps<{
  rows: any[],
  headers: Record<string, string>,
  filename: string,
}>()

const fields = computed(() => Object.keys(props.headers))
</script>
