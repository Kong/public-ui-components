<template>
  <EnumField
    :items="toSelectItems([...HTTP_METHODS])"
    :name="name"
  />
</template>

<script setup lang="ts">
import { EnumField, toSelectItems } from '@kong-ui-public/freeform'
import { HTTP_METHODS } from '../../constants'

defineProps<{
  name: string
}>()
</script>
