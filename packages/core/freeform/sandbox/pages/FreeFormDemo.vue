<template>
  <SandboxLayout title="Free Form (Mocking Schema)">
    <Form
      class="form"
      :schema="buildMockingSchema()"
      @change="console.log"
    />
  </SandboxLayout>
</template>

<script setup lang="ts">
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
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
