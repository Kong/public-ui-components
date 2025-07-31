<template>
  <EnumField
    :items="toSelectItems([...HTTP_METHODS])"
    multiple
    :name="name"
  />
</template>

<script setup lang="ts">
import EnumField from '@freeform/EnumField.vue'
import { toSelectItems } from '@freeform/utils'
import { HTTP_METHODS } from '../../constants'

defineProps<{
  name: string
}>()
</script>
