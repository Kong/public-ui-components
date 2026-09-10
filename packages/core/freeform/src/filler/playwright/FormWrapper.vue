<script setup lang="ts">
import Form from '../../components/Form.vue'
import type { FormSchema } from '../../form-schema'

defineProps<{
  schema: FormSchema
}>()
</script>

<template>
  <div class="form-wrapper">
    <Form :schema="schema" />
  </div>
</template>

<style lang="scss" scoped>
.form-wrapper {
  padding: 20px;
}
</style>
