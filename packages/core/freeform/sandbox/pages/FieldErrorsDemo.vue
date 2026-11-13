<template>
  <SandboxPage title="Field Errors">
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

      <!--
        The host's own error list. Showing errors and revealing fields are separate
        features of the form; this list is where the host puts them together.
      -->
      <ul
        v-if="errors.length"
        class="summary"
        data-testid="error-summary"
      >
        <li
          v-for="error in errors"
          :key="error.path"
        >
          <template v-if="isUnmatched(error)">
            <code>{{ error.path || '(entity)' }}</code> {{ error.message }}
            <em>(not shown in the form)</em>
          </template>
          <a
            v-else
            href="#"
            @click.prevent="formRef?.reveal(error.path)"
          >
            <code>{{ error.path || '(entity)' }}</code> {{ error.message }}
          </a>
        </li>
      </ul>
    </div>

    <Form
      ref="form"
      v-model:errors="errors"
      class="form"
      :data="data"
      :render-rules="renderRules"
      :schema="schema"
    >
      <template #[FIELD_RENDERERS]>
        <FieldRenderer
          v-slot="fieldProps"
          :match="({ path }) => path === 'upstreams'"
        >
          <ArrayField
            v-bind="fieldProps"
            appearance="tabs"
            :item-label="(_: unknown, index: number) => `Upstream #${index}`"
          />
        </FieldRenderer>
      </template>
    </Form>
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SandboxPage from '../SandboxPage.vue'
import { ArrayField, FieldRenderer, Form, FIELD_RENDERERS } from '../../src'
import type { FormSchema } from '../../src/form-schema'
import type { FieldError, RenderRules, RevealResult } from '../../src'

// Errors the server might send back, already in the data path format. The
// entity check errors use the gateway's wording: a check fails on the record
// it is declared on, and names the fields only in its message.
const SAMPLE_ERRORS: FieldError[] = [
  // A check declared at the top of the schema: the gateway puts it on the
  // whole entity (Konnect: `ERROR_TYPE_ENTITY`, no field), so no field shows it
  { path: '', message: "at least one of these fields must be non-empty: 'cache.ttl', 'rate_limit.redis.host'" },
  { path: 'name', message: 'required field missing' },
  // A check declared on a record (Konnect: `connection.tls.@entity[0]`)
  { path: 'connection.tls', message: "all or none of these fields must be set: 'verify', 'client_cert'" },
  { path: 'connection.tls.client_cert', message: 'invalid PEM certificate' },
  { path: 'upstreams.2.host', message: 'invalid hostname' },
  // A check declared on the record of an array item
  { path: 'servers.0', message: "only one or none of these fields must be set: 'host', 'port'" },
  { path: 'servers.1.port', message: 'value should be between 0 and 65535' },
  { path: 'headers.X-Request-Id', message: 'length must be at least 8' },
  { path: 'headers["x.y"]', message: 'header names must not contain a dot' },
  { path: 'tags.1', message: 'tags must be lowercase' },
  { path: 'cache.ttl', message: 'expected an integer' },
  { path: 'rate_limit.redis.host', message: 'required field missing' },
  { path: 'no_such.field', message: 'unknown field' },
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
  fields: [
    { name: { type: 'string', required: true } },
    {
      connection: {
        type: 'record',
        required: true,
        fields: [
          { timeout: { type: 'integer' } },
          {
            tls: {
              type: 'record',
              fields: [
                { verify: { type: 'boolean' } },
                { client_cert: { type: 'string' } },
              ],
            },
          },
        ],
      },
    },
    {
      upstreams: {
        type: 'array',
        elements: {
          type: 'record',
          fields: [{ host: { type: 'string' } }],
        },
      },
    },
    {
      servers: {
        type: 'array',
        elements: {
          type: 'record',
          fields: [
            { host: { type: 'string' } },
            { port: { type: 'integer' } },
          ],
        },
      },
    },
    {
      headers: {
        type: 'map',
        keys: { type: 'string' },
        values: { type: 'string' },
      },
    },
    { tags: { type: 'set', elements: { type: 'string' } } },
    {
      cache: {
        type: 'record',
        fields: [{ ttl: { type: 'integer' } }],
      },
    },
    {
      rate_limit: {
        type: 'record',
        required: true,
        fields: [
          { strategy: { type: 'string', one_of: ['local', 'redis'], default: 'local' } },
          {
            redis: {
              type: 'record',
              required: true,
              fields: [{ host: { type: 'string' } }],
            },
          },
        ],
      },
    },
  ],
}

const renderRules: RenderRules = {
  dependencies: {
    'rate_limit.redis': ['rate_limit.strategy', 'redis'],
  },
}

const data = {
  name: '',
  connection: {
    timeout: 1000,
    tls: { verify: true, client_cert: 'not a cert' },
  },
  upstreams: [{ host: 'a.example.com' }, { host: 'b.example.com' }, { host: 'c..example' }],
  servers: [
    { host: 'one.example.com', port: 80 },
    { host: 'two.example.com', port: 70000 },
  ],
  headers: {
    'X-Request-Id': 'abc',
    'x.y': 'dotted key',
  },
  tags: ['ok', 'NotOk'],
  cache: null,
  rate_limit: {
    strategy: 'local',
    redis: { host: '' },
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
  max-height: 180px;
  overflow: auto;
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
