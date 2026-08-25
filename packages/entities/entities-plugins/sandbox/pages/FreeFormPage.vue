<template>
  <SandboxPage title="Free Form (Mocking Schema)">
    <Form
      class="form"
      :schema="buildMockingSchema()"
      @change="console.log"
    />
  </SandboxPage>
</template>

<script lang="ts" setup>
import SandboxPage from '../SandboxPage.vue'
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
</style>
