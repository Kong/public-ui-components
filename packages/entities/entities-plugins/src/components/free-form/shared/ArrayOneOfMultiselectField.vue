<template>
  <EnumField
    v-bind="props"
    multiple
  />
</template>

<script setup lang="ts">
import EnumField from './EnumField.vue'
import type { BaseFieldProps } from './types'

const props = defineProps<BaseFieldProps>()
</script>
