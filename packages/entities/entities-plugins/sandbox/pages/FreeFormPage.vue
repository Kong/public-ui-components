<template>
  <SandboxLayout
    :links="appLinks"
    title="Free Form (Mocking Schema)"
  >
    <Form
      class="form"
      :schema="buildMockingSchema()"
      @change="console.log"
    />
  </SandboxLayout>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { buildMockingSchema } from '../../fixtures/schemas/free-form-mocking'
import Form from '../../src/components/free-form/shared/Form.vue'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])
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
