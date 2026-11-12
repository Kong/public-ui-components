<template>
  <SandboxPage title="Field Navigation">
    <div class="controls">
      <form
        class="path-form"
        @submit.prevent="go(path)"
      >
        <KInput
          v-model="path"
          class="path-input"
          data-testid="reveal-path-input"
          placeholder="e.g. connection.tls.client_cert or headers[&quot;x.y&quot;]"
        />
        <KButton
          data-testid="reveal-go"
          type="submit"
        >
          Go
        </KButton>
        <KButton
          appearance="secondary"
          @click="collapseAll"
        >
          Collapse all records
        </KButton>
      </form>

      <div class="presets">
        <KButton
          v-for="preset in PRESETS"
          :key="preset.path"
          appearance="tertiary"
          size="small"
          :title="preset.note"
          @click="go(preset.path)"
        >
          {{ preset.path }}
        </KButton>
      </div>

      <p
        class="result"
        data-testid="reveal-result"
      >
        {{ resultText }}
      </p>
    </div>

    <Form
      ref="form"
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
import { computed, ref, useTemplateRef } from 'vue'
import SandboxPage from '../SandboxPage.vue'
import { ArrayField, FieldRenderer, Form, FIELD_RENDERERS } from '../../src'
import type { FormSchema, NamedFieldSchema } from '../../src/form-schema'
import type { RenderRules, RevealResult } from '../../src'

const PRESETS = [
  { path: 'connection.tls.client_cert', note: 'Nested records. Collapse them first to see them expand.' },
  { path: 'upstreams.2.health.path', note: 'Switches to the third tab.' },
  { path: 'servers.1.port', note: 'An item of a card array.' },
  { path: 'headers.X-Request-Id', note: 'A map entry.' },
  { path: 'headers["x.y"]', note: 'A map key with a dot in it.' },
  { path: 'cache.ttl', note: 'The record is switched off, so the reveal stops at it.' },
  { path: 'rate_limit.redis.host', note: 'Hidden by a render rule, so the reveal stops at the nearest visible ancestor.' },
  { path: 'no_such.field', note: 'Not in the form.' },
]

const path = ref(PRESETS[0].path)
const result = ref<RevealResult | null | undefined>()
// `Form` is generic, so `InstanceType` can't name its exposed API
const formRef = useTemplateRef<{ reveal: (path: string) => Promise<RevealResult | null> }>('form')

let lastGo = 0

async function go(target: string) {
  const id = ++lastGo
  path.value = target
  result.value = undefined
  const revealed = await formRef.value?.reveal(target) ?? null
  // A later click takes over; its result is the one to show
  if (id === lastGo) {
    result.value = revealed
  }
}

const resultText = computed(() => {
  if (result.value === undefined) return 'Pick a path, or type one and press Go.'
  if (result.value === null) return 'Nothing to reveal.'
  return result.value.exact
    ? `Revealed ${result.value.path}`
    : `Stopped at ${result.value.path} (the target itself can't be shown)`
})

// Sandbox helper: records with a value start expanded, so collapse them to
// see a reveal expand them again.
function collapseAll() {
  document
    .querySelectorAll<HTMLButtonElement>('.form [data-testid^="ff-object-toggle-btn-"][aria-expanded="true"]')
    .forEach(button => button.click())
}

// Plain fields that make the form long enough to need scrolling
const fillerFields: NamedFieldSchema[] = Array.from({ length: 12 }, (_, i) => ({
  [`setting_${String(i + 1).padStart(2, '0')}`]: { type: 'string' },
}))

const schema: FormSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string', required: true } },
    ...fillerFields.slice(0, 6),
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
          fields: [
            { host: { type: 'string' } },
            {
              health: {
                type: 'record',
                fields: [
                  { path: { type: 'string' } },
                  { interval: { type: 'integer' } },
                ],
              },
            },
          ],
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
    ...fillerFields.slice(6),
    {
      headers: {
        type: 'map',
        keys: { type: 'string' },
        values: { type: 'string' },
      },
    },
    {
      cache: {
        type: 'record',
        fields: [
          { ttl: { type: 'integer' } },
        ],
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
              fields: [
                { host: { type: 'string' } },
              ],
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
  name: 'demo',
  connection: {
    timeout: 1000,
    tls: { verify: true, client_cert: '' },
  },
  upstreams: [
    { host: 'a.example.com', health: { path: '/a', interval: 5 } },
    { host: 'b.example.com', health: { path: '/b', interval: 5 } },
    { host: 'c.example.com', health: { path: '/c', interval: 5 } },
  ],
  servers: [
    { host: 'one.example.com', port: 80 },
    { host: 'two.example.com', port: 443 },
  ],
  headers: {
    'X-Request-Id': 'abc',
    'x.y': 'dotted key',
  },
  cache: null,
  rate_limit: {
    strategy: 'local',
    redis: { host: 'localhost' },
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

.path-form {
  align-items: center;
  display: flex;
  gap: 8px;
}

.path-input {
  width: 420px;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.result {
  font-family: monospace;
  margin: 0;
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
