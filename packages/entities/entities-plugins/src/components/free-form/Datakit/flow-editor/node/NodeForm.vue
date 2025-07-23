<template>
  <Form :schema="schema" />
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import type { FormSchema } from '../../../../../types/plugins/form-schema'

defineProps<{
  schema: FormSchema
}>()
</script>

