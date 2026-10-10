<template>
  <SandboxPage title="Auto rendering">
    <Form
      class="form"
      :schema="buildMockingSchema()"
      @change="console.log"
    />
  </SandboxPage>
</template>

<script setup lang="ts">
import SandboxPage from '../SandboxPage.vue'
import { Form } from '../../src'
import { buildMockingSchema } from '../../src/components/free-form-mocking'
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
