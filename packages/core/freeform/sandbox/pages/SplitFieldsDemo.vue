<template>
  <SandboxPage title="Split fields">
    <div class="controls">
      <div class="buttons">
        <KButton
          data-testid="load-errors"
          @click="errors = SAMPLE_ERRORS"
        >
          Load sample errors
        </KButton>
        <KButton
          appearance="secondary"
          @click="errors = []"
        >
          Clear errors
        </KButton>
      </div>

      <ul
        v-if="errors.length"
        class="summary"
      >
        <li
          v-for="error in errors"
          :key="error.path"
        >
          <template v-if="isUnmatched(error)">
            <code>{{ error.path }}</code> {{ error.message }}
            <em>(not shown in the form)</em>
          </template>
          <a
            v-else
            href="#"
            @click.prevent="formRef?.reveal(error.path)"
          >
            <code>{{ error.path }}</code> {{ error.message }}
          </a>
        </li>
      </ul>
    </div>

    <!--
      `config` is split the way entities-plugins' CommonForm does it: one record
      shows the default fields, another one in the advanced section shows the rest.
      Each leaves out the other's fields with `omit`; both leave out `legacy_key`.
    -->
    <Form
      ref="form"
      v-model:errors="errors"
      class="form"
      :data="data"
      :schema="schema"
    >
      <ObjectField
        as-child
        name="config"
        :omit="['timeout', 'redis', 'legacy_key']"
      />
      <AdvancedSection>
        <ObjectField
          as-child
          name="config"
          :omit="['host', 'port', 'legacy_key']"
        />
      </AdvancedSection>
    </Form>
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SandboxPage from '../SandboxPage.vue'
import AdvancedSection from '../components/AdvancedSection.vue'
import { Form, ObjectField } from '../../src'
import type { FormSchema } from '../../src/form-schema'
import type { FieldError, RevealResult } from '../../src'

const SAMPLE_ERRORS: FieldError[] = [
  { path: 'config.host', message: 'invalid hostname' },
  // In the collapsed advanced section
  { path: 'config.timeout', message: 'must be positive' },
  { path: 'config.redis.host', message: 'required field missing' },
  // Left out by both records, so no field shows it
  { path: 'config.legacy_key', message: 'unknown field' },
]

const errors = ref<FieldError[]>([])

// `Form` is generic, so `InstanceType` can't name its exposed API
const formRef = useTemplateRef<{
  reveal: (path: string) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
}>('form')

function isUnmatched(error: FieldError) {
  return !!formRef.value?.unmatchedErrors.includes(error)
}

const schema: FormSchema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { host: { type: 'string', required: true } },
        { port: { type: 'integer', required: true } },
        { timeout: { type: 'integer' } },
        {
          redis: {
            type: 'record',
            fields: [{ host: { type: 'string' } }],
          },
        },
        { legacy_key: { type: 'string' } },
      ],
    },
  }],
}

const data = {
  config: {
    host: 'bad host',
    port: 8000,
    timeout: -1,
    redis: { host: '' },
    legacy_key: 'x',
  },
}
</script>

<style scoped>
.controls {
  background: #fff;
  border-bottom: 1px solid #e0e4ea;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.buttons {
  display: flex;
  gap: 8px;
}

.summary {
  font-size: 13px;
  margin: 0;
  padding-left: 20px;
}

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
