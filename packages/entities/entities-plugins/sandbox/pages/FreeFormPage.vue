<template>
  <Form
    class="form"
    :schema="schema"
  />
</template>

<script lang="ts" setup>
import { buildMockingSchema } from '../../fixtures/schemas/free-form-mocking'
import Form from '../../src/components/free-form/shared/Form.vue'

const schema = buildMockingSchema()
</script>

<style scoped>

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
  max-width: 100%;
  padding: 20px;
  width: 800px;
}
</style>
