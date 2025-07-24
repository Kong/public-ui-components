<template>
  <EnumField
    :items="toSelectItems(HTTP_METHODS)"
    multiple
    :name="name"
  />
</template>

<script setup lang="ts">
import EnumField from '../../../shared/EnumField.vue'
import { toSelectItems } from '../../../shared/utils'
import { HTTP_METHODS } from '../constants'

defineProps<{
  name: string
}>()
</script>
