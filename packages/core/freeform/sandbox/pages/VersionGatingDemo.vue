<template>
  <SandboxPage title="Free Form (Version Gating)">
    <template #controls>
      <div class="version-picker">
        <KInputSwitch
          id="version-gating"
          v-model="versionGating"
        />
        <KLabel for="version-gating">
          Version gating
        </KLabel>
      </div>
      <div class="version-picker">
        <KLabel for="min-runtime-version">
          Runtime version
        </KLabel>
        <KSelect
          id="min-runtime-version"
          v-model="minRuntimeVersion"
          :items="versionItems"
          style="width: 220px;"
        />
      </div>
    </template>
    <Form
      class="form"
      :config="{ minRuntimeVersion, versionGating }"
      :schema="schema"
      @change="console.log"
    >
      <template #[FIELD_RENDERERS]>
        <FieldRenderer
          v-slot="fieldProps"
          :match="({ path }) => path === 'prompt_template'"
        >
          <StringField
            v-bind="fieldProps"
            multiline
            :rows="4"
          />
        </FieldRenderer>
      </template>
    </Form>
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SandboxPage from '../SandboxPage.vue'
import { Form, FieldRenderer, StringField, FIELD_RENDERERS } from '../../src'
import type { FormSchema } from '../../src/form-schema'

const minRuntimeVersion = ref<string | undefined>('2.0')

const versionGating = ref(true)

const versionItems = [
  { value: '', label: 'Not provided (fail-open)' },
  { value: '2.0', label: '2.0' },
  { value: '2.1', label: '2.1' },
  { value: '2.2', label: '2.2' },
]

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      identifier: {
        type: 'string',
        description: 'Mirrors a real AI Gateway rate-limiting-advanced field: some identifier '
          + 'strategies were only added in AI Gateway 2.1.',
        one_of: [
          'consumer',
          'consumer_group',
          'credential',
          'ip',
          'header',
          'path',
          'model',
          'provider',
          'service',
        ],
        enum_min_versions: [
          { min_ai_gateway_version: '2.1', value: 'credential' },
          { min_ai_gateway_version: '2.1', value: 'service' },
        ],
      },
    },
    {
      semantic_cache_strategy: {
        type: 'string',
        description: 'A whole field that only exists as of AI Gateway 2.2 — the field itself '
          + 'is disabled (not hidden) below that version.',
        one_of: ['exact', 'semantic'],
        min_ai_gateway_version: '2.2',
      },
    },
    {
      webhook_secret: {
        type: 'string',
        description: 'A plain StringField (no one_of/enum) gated the same way — hover the '
          + 'disabled input to see why.',
        encrypted: true,
        min_ai_gateway_version: '2.1',
      },
    },
    {
      prompt_template: {
        type: 'string',
        description: 'Same gating on a multiline StringField (rendered as a textarea via the '
          + 'field-renderers slot).',
        min_ai_gateway_version: '2.1',
      },
    },
  ],
}
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
