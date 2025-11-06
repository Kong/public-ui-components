<template>
  <Form
    class="form"
    :schema="buildMockingSchema()"
    @change="console.log"
  />
</template>

<script lang="ts" setup>
import { buildMockingSchema } from '../../fixtures/schemas/free-form-mocking'
import Form from '../../src/components/free-form/shared/Form.vue'
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

:global(body) {
  background: #F9FAFB
}
</style>
