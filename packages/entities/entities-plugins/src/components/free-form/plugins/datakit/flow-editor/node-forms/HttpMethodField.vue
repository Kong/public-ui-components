<template>
  <EnumField
    :items="toSelectItems([...HTTP_METHODS])"
    :name="name"
  />
</template>

<script setup lang="ts">
import EnumField from '../../../../core/components/EnumField.vue'
import { toSelectItems } from '../../../../core/utils'
import { HTTP_METHODS } from '../../constants'

defineProps<{
  name: string
}>()
</script>
