<template>
  <SandboxPage title="Error summary">
    <div class="page">
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

      <Form
        ref="form"
        v-model:errors="errors"
        class="form"
        :data="data"
        :schema="schema"
      />

      <ErrorSummary
        :errors="errors"
        :schema="schema"
        :unmatched-errors="formRef?.unmatchedErrors"
        @reveal="path => formRef?.reveal(path)"
        @select="error => formRef?.reveal(error.path)"
      />
    </div>
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { Form } from '../../src/freeform'
import SandboxPage from '../SandboxPage.vue'
import ErrorSummary from '../../src/components/free-form/components/ErrorSummary.vue'

import type { FieldError, FormSchema, RevealResult } from '@kong-ui-public/freeform'

// Already in the data path format; parsing the server response is a later step
const SAMPLE_ERRORS: FieldError[] = [
  // An entity check on the whole plugin: no field shows it
  { path: '', message: "at least one of these fields must be non-empty: 'config.second', 'config.minute', 'config.hour', 'config.day', 'config.month', 'config.year'" },
  { path: 'config.minute', message: 'value must be greater than 0' },
  // Long messages that wrap onto several lines
  { path: 'config.policy', message: "when 'policy' is 'redis', 'redis.host' and 'redis.port' must be set, and 'redis.timeout' must be at least 100 ms longer than the slowest Redis command you expect, or requests are rejected while the connection is retried" },
  { path: 'config.limits.bronze.per_hour', message: "value must be greater than or equal to 'per_minute' multiplied by 60, because an hourly limit lower than the minute limit would block a client long before its per-minute quota runs out" },
  { path: 'config.limits.platinum_enterprise_customers.per_hour', message: 'value must be greater than 0; this tier is not in the data, so no field shows this error and it is listed here without a link' },
  { path: 'config.redis.host', message: 'required field missing' },
  { path: 'config.redis.port', message: 'value should be between 0 and 65535' },
  // Array of strings: the second item
  { path: 'config.paths.1', message: 'should start with: /' },
  // Array of records: the array itself, and a field of its second item
  { path: 'config.servers', message: 'length must be at most 2' },
  { path: 'config.servers.1.port', message: 'value should be between 0 and 65535' },
  // Map of strings, including a key with a dot in it
  { path: 'config.headers.X-Limit', message: 'length must be at least 8' },
  { path: 'config.headers["x.trace"]', message: 'header names must not contain a dot' },
  // Map of records
  { path: 'config.limits.gold.per_minute', message: 'value must be greater than 0' },
  // A map key that isn't in the data: no field shows it
  { path: 'config.limits.silver.per_minute', message: 'value must be greater than 0' },
  { path: 'config.error_message', message: 'length must be at most 256' },
  { path: 'config.no_such_field', message: 'unknown field' },
]

const errors = ref<FieldError[]>([])

// `Form` is generic, so `InstanceType` can't name its exposed API
const formRef = useTemplateRef<{
  reveal: (path: string) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
}>('form')

// Long enough to scroll, so the summary sticks to the bottom
const schema: FormSchema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { second: { type: 'number' } },
        { minute: { type: 'number' } },
        { hour: { type: 'number' } },
        { day: { type: 'number' } },
        { month: { type: 'number' } },
        { year: { type: 'number' } },
        { limit_by: { type: 'string', one_of: ['consumer', 'credential', 'ip', 'service', 'header', 'path'], default: 'consumer' } },
        { header_name: { type: 'string' } },
        { path: { type: 'string' } },
        { policy: { type: 'string', one_of: ['local', 'cluster', 'redis'], default: 'local' } },
        {
          redis: {
            type: 'record',
            required: true,
            fields: [
              { host: { type: 'string' } },
              { port: { type: 'integer' } },
              { username: { type: 'string' } },
              { password: { type: 'string' } },
              { database: { type: 'integer' } },
              { timeout: { type: 'integer' } },
            ],
          },
        },
        { paths: { type: 'array', elements: { type: 'string' } } },
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
        {
          limits: {
            type: 'map',
            keys: { type: 'string' },
            values: {
              type: 'record',
              fields: [
                { per_minute: { type: 'integer' } },
                { per_hour: { type: 'integer' } },
              ],
            },
          },
        },
        { fault_tolerant: { type: 'boolean' } },
        { hide_client_headers: { type: 'boolean' } },
        { error_code: { type: 'number' } },
        { error_message: { type: 'string' } },
      ],
    },
  }],
}

const data = {
  config: {
    second: null,
    minute: -1,
    hour: null,
    day: null,
    month: null,
    year: null,
    limit_by: 'consumer',
    header_name: null,
    path: null,
    policy: 'redis',
    redis: {
      host: '',
      port: 70000,
      username: null,
      password: null,
      database: 0,
      timeout: 2000,
    },
    paths: ['/api', 'v2', '/health'],
    servers: [
      { host: 'one.example.com', port: 8000 },
      { host: 'two.example.com', port: 70000 },
      { host: 'three.example.com', port: 8002 },
    ],
    headers: { 'X-Limit': 'abc', 'x.trace': 'on' },
    limits: {
      gold: { per_minute: 0, per_hour: 1000 },
      bronze: { per_minute: 10, per_hour: 100 },
    },
    fault_tolerant: true,
    hide_client_headers: false,
    error_code: 429,
    error_message: 'API rate limit exceeded',
  },
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
  max-width: 100%;
  padding: 20px;
  width: 800px;
}

.buttons {
  display: flex;
  gap: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
