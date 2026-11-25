<template>
  <SandboxPage title="Reveal Containers">
    <div class="layout">
      <aside class="panel">
        <section>
          <h3>Errors</h3>
          <div class="buttons">
            <KButton
              data-testid="load-errors"
              size="small"
              @click="errors = SAMPLE_ERRORS"
            >
              Load sample errors
            </KButton>
            <KButton
              appearance="secondary"
              size="small"
              @click="errors = []"
            >
              Clear
            </KButton>
          </div>
          <ul class="error-list">
            <li
              v-for="error in errors"
              :key="`${error.path}:${error.message}`"
            >
              <a
                v-if="!isUnmatched(error)"
                href="#"
                @click.prevent="revealPath(error.path)"
              >
                <code>{{ error.path || '(entity)' }}</code>
              </a>
              <code v-else>{{ error.path || '(entity)' }}</code>
              {{ error.message }}
              <em v-if="isUnmatched(error)">(unmatched)</em>
            </li>
          </ul>
        </section>

        <section>
          <h3>Reveal</h3>
          <div class="reveal-input">
            <KInput
              v-model="revealInput"
              data-testid="reveal-input"
              placeholder="caching.redis.host"
              @keyup.enter="revealPath(revealInput)"
            />
            <KButton
              size="small"
              @click="revealPath(revealInput)"
            >
              Reveal
            </KButton>
          </div>
          <div class="buttons">
            <KButton
              appearance="tertiary"
              data-testid="close-all"
              size="small"
              @click="closeEverything"
            >
              Close everything
            </KButton>
          </div>
          <pre
            v-if="lastReveal"
            class="result"
            data-testid="reveal-result"
          >{{ lastReveal }}</pre>
        </section>

        <section>
          <h3>Reveal tree</h3>
          <p class="hint">
            What the form found in its content, mounted or not. ▸ marks a container's slot.
          </p>
          <pre class="tree">{{ treeText }}</pre>
        </section>

        <section>
          <h3>Things to try</h3>
          <ul class="hint">
            <li>Load the errors, then click any of them: tabs switch and sections open on the way.</li>
            <li><code>caching.redis.host</code> sits behind a plain <code>v-if</code>: unmatched until you tick "Show tuning options" once. Untick it, then reveal it: the form lands where it was.</li>
            <li><code>connection.proxy_url</code> is rendered by a component with no adapter: unmatched until the Connection tab has shown it once.</li>
            <li><code>security.password</code> belongs to the "basic" auth mode, a <code>v-if</code> on the data: it stays unmatched while the mode is "oauth".</li>
            <li><code>observability.sample_rate</code> is rendered by a component whose adapter names its fields: found before it ever mounts.</li>
            <li><code>observability.debug_body</code> shows only while the log level is "debug" (a render rule): unmatched, and a reveal opens nothing for it. Set the log level to "debug" and it opens like any other.</li>
            <li>A field a render rule hides is never revealed from memory either: set the cache strategy to "memory" after showing the tuning options once, and <code>caching.redis.host</code> goes back to unmatched.</li>
          </ul>
        </section>
      </aside>

      <Form
        ref="form"
        v-model:errors="errors"
        class="form"
        :data="data"
        :render-rules="renderRules"
        :schema="schema"
        @change="(value: Record<string, any>) => formValue = value"
      >
        <Field name="name" />

        <KTabs
          key="groups"
          v-model="activeTab"
          :tabs="TABS"
        >
          <template
            v-for="tab in TABS"
            :key="tab.hash"
            #[`${tab.hash.slice(1)}-anchor`]
          >
            {{ tab.title }}
            <span
              v-if="tabErrorCount(tab.hash.slice(1))"
              class="count"
            >{{ tabErrorCount(tab.hash.slice(1)) }}</span>
          </template>

          <template #connection>
            <div class="group">
              <Field name="connection.host" />
              <Field name="connection.port" />
              <ProxySettings />
              <KCollapse
                key="connection-advanced"
                v-model="collapsed.connection"
              >
                <template #title>
                  Advanced connection
                  <span
                    v-if="collapseErrorCount('connection-advanced')"
                    class="count"
                  >{{ collapseErrorCount('connection-advanced') }}</span>
                </template>
                <Field name="connection.timeout" />
                <Field name="connection.retries" />
                <Field name="connection.upstreams" />
              </KCollapse>
            </div>
          </template>

          <template #security>
            <div class="group">
              <ObjectField name="security.tls" />
              <Field name="security.auth_mode" />
              <!-- On the data: these fields don't exist in the other mode, so a reveal leaves it alone -->
              <template v-if="formValue.security?.auth_mode === 'basic'">
                <Field name="security.username" />
                <Field name="security.password" />
              </template>
              <template v-else>
                <Field name="security.client_id" />
                <Field name="security.client_secret" />
              </template>
              <KCollapse
                key="security-advanced"
                v-model="collapsed.security"
              >
                <template #title>
                  Advanced security
                  <span
                    v-if="collapseErrorCount('security-advanced')"
                    class="count"
                  >{{ collapseErrorCount('security-advanced') }}</span>
                </template>
                <Field name="security.scopes" />
              </KCollapse>
            </div>
          </template>

          <template #caching>
            <div class="group">
              <Field name="caching.ttl" />
              <KCheckbox
                v-model="showCacheTuning"
                data-testid="show-cache-tuning"
                label="Show tuning options"
              />
              <!-- View state behind a plain `v-if`: the form learns these fields once they have shown -->
              <div
                v-if="showCacheTuning"
                class="tuning"
              >
                <Field name="caching.strategy" />
                <ObjectField name="caching.redis" />
              </div>
            </div>
          </template>

          <template #observability>
            <div class="group">
              <Field name="observability.trace_header" />
              <KCollapse
                key="debugging"
                v-model="collapsed.debugging"
              >
                <template #title>
                  Debugging
                  <span
                    v-if="collapseErrorCount('debugging')"
                    class="count"
                  >{{ collapseErrorCount('debugging') }}</span>
                </template>
                <DebugSettings />
                <!-- Shown by a render rule only while the log level is "debug" -->
                <Field name="observability.debug_body" />
              </KCollapse>
            </div>
          </template>
        </KTabs>

        <KCollapse
          key="extras"
          v-model="collapsed.extras"
        >
          <template #title>
            Extras
            <span
              v-if="collapseErrorCount('extras')"
              class="count"
            >{{ collapseErrorCount('extras') }}</span>
          </template>
          <Field name="headers" />
          <Field name="tags" />
        </KCollapse>
      </Form>
    </div>
  </SandboxPage>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { KCollapse, KTabs } from '@kong/kongponents'
import SandboxPage from '../SandboxPage.vue'
import DebugSettings from '../components/DebugSettings.vue'
import ProxySettings from '../components/ProxySettings.vue'
import '../reveal-adapters'
import { Field, Form, ObjectField } from '../../src'
import type { FormSchema } from '../../src/form-schema'
import type { FieldError, RenderRules, RevealContainerQuery, RevealNode, RevealResult } from '../../src'

const TABS = [
  { hash: '#connection', title: 'Connection' },
  { hash: '#security', title: 'Security' },
  { hash: '#caching', title: 'Caching' },
  { hash: '#observability', title: 'Observability' },
]

const SAMPLE_ERRORS: FieldError[] = [
  { path: '', message: 'the plugin conflicts with another one on this route' },
  { path: 'connection.host', message: 'required field missing' },
  { path: 'connection.timeout', message: 'value should be between 1 and 60000' },
  { path: 'connection.upstreams.1.host', message: 'invalid hostname' },
  { path: 'connection.proxy_url', message: 'must be a URL' },
  { path: 'security.tls.client_cert', message: 'invalid PEM certificate' },
  { path: 'security.password', message: 'length must be at least 8' },
  { path: 'security.client_secret', message: 'required field missing' },
  { path: 'security.scopes.0', message: 'unknown scope' },
  { path: 'caching.strategy', message: 'expected one of: memory, redis' },
  { path: 'caching.redis.host', message: 'required field missing' },
  { path: 'observability.sample_rate', message: 'value should be between 0 and 1' },
  { path: 'observability.debug_body', message: 'must be off in production' },
  { path: 'tags.1', message: 'tags must be lowercase' },
]

const schema: FormSchema = {
  type: 'record',
  fields: [
    { name: { type: 'string', required: true } },
    {
      connection: {
        type: 'record',
        fields: [
          { host: { type: 'string', required: true } },
          { port: { type: 'integer' } },
          { proxy_url: { type: 'string' } },
          { timeout: { type: 'integer' } },
          { retries: { type: 'integer' } },
          {
            upstreams: {
              type: 'array',
              elements: { type: 'record', fields: [{ host: { type: 'string' } }, { weight: { type: 'integer' } }] },
            },
          },
        ],
      },
    },
    {
      security: {
        type: 'record',
        fields: [
          {
            tls: {
              type: 'record',
              fields: [{ verify: { type: 'boolean' } }, { client_cert: { type: 'string' } }],
            },
          },
          { auth_mode: { type: 'string', one_of: ['basic', 'oauth'], default: 'oauth' } },
          { username: { type: 'string' } },
          { password: { type: 'string' } },
          { client_id: { type: 'string' } },
          { client_secret: { type: 'string' } },
          { scopes: { type: 'set', elements: { type: 'string' } } },
        ],
      },
    },
    {
      caching: {
        type: 'record',
        fields: [
          { ttl: { type: 'integer' } },
          { strategy: { type: 'string', one_of: ['memory', 'redis'], default: 'memory' } },
          {
            redis: {
              type: 'record',
              fields: [{ host: { type: 'string' } }, { port: { type: 'integer' } }],
            },
          },
        ],
      },
    },
    {
      observability: {
        type: 'record',
        fields: [
          { trace_header: { type: 'string' } },
          { log_level: { type: 'string', one_of: ['debug', 'info', 'warn'] } },
          { sample_rate: { type: 'number' } },
          { debug_body: { type: 'boolean' } },
        ],
      },
    },
    { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
    { tags: { type: 'set', elements: { type: 'string' } } },
  ],
}

const renderRules: RenderRules = {
  dependencies: {
    'caching.redis': ['caching.strategy', 'redis'],
    'observability.debug_body': ['observability.log_level', 'debug'],
  },
}

const data = {
  name: '',
  connection: {
    host: '',
    port: 443,
    proxy_url: 'not a url',
    timeout: 0,
    retries: 3,
    upstreams: [{ host: 'a.example.com', weight: 10 }, { host: 'bad host', weight: 5 }],
  },
  security: {
    tls: { verify: true, client_cert: 'not a cert' },
    auth_mode: 'oauth',
    password: 'short',
    client_secret: '',
    scopes: ['unknown'],
  },
  caching: {
    ttl: 60,
    strategy: 'redis',
    redis: { host: '', port: 6379 },
  },
  observability: { trace_header: 'x-trace', log_level: 'info', sample_rate: 2, debug_body: true },
  headers: { 'X-Request-Id': 'abc' },
  tags: ['a', 'B'],
}

const errors = ref<FieldError[]>([])
const formValue = ref<Record<string, any>>(data)

const activeTab = ref('#connection')
const collapsed = reactive({ connection: true, security: true, debugging: true, extras: true })
const showCacheTuning = ref(false)

// `Form` is generic, so `InstanceType` can't name its exposed API
const formRef = useTemplateRef<{
  reveal: (path: string) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
  revealTree: RevealNode[]
  getContainerErrors: (query: RevealContainerQuery) => FieldError[]
}>('form')

function isUnmatched(error: FieldError) {
  return !!formRef.value?.unmatchedErrors.includes(error)
}

function tabErrorCount(slotName: string) {
  return formRef.value?.getContainerErrors({ component: KTabs, key: 'groups', slotName }).length ?? 0
}

function collapseErrorCount(key: string) {
  return formRef.value?.getContainerErrors({ component: KCollapse, key }).length ?? 0
}

const revealInput = ref('caching.redis.host')
const lastReveal = ref('')

async function revealPath(path: string) {
  const result = await formRef.value?.reveal(path)
  lastReveal.value = `reveal(${JSON.stringify(path)})\n→ ${JSON.stringify(result ?? null, null, 2)}`
}

function closeEverything() {
  activeTab.value = '#observability'
  collapsed.connection = true
  collapsed.security = true
  collapsed.debugging = true
  collapsed.extras = true
  showCacheTuning.value = false
}

function describe(nodes: RevealNode[], indent = ''): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'field') {
      const exclude = node.cover.exclude?.length ? ` (except ${node.cover.exclude.join(', ')})` : ''
      return [`${indent}${node.cover.path}${exclude}`]
    }
    const name = (node.component as { name?: string, __name?: string }).name ?? (node.component as { __name?: string }).__name ?? 'container'
    const key = node.key != null ? ` key=${String(node.key)}` : ''
    return [`${indent}▸ ${name}${key} #${node.slotName}`, ...describe(node.children, `${indent}    `)]
  })
}

const treeText = computed(() => describe(formRef.value?.revealTree ?? []).join('\n'))
</script>

<style lang="scss" scoped>
.layout {
  align-items: flex-start;
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(320px, 420px) 1fr;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 120px);
  overflow: auto;
  position: sticky;
  top: 16px;

  h3 {
    font-size: 14px;
    margin: 0 0 8px;
  }
}

.buttons,
.reveal-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.error-list {
  font-size: 13px;
  margin: 0;
  padding-left: 16px;

  li {
    margin-bottom: 4px;
  }

  em {
    color: #999;
  }
}

.hint {
  color: #666;
  font-size: 12px;
  margin: 0 0 8px;
  padding-left: 16px;
}

p.hint {
  padding-left: 0;
}

.result,
.tree {
  background: #f6f8fa;
  border-radius: 4px;
  font-size: 12px;
  margin: 0;
  padding: 8px;
  white-space: pre-wrap;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.tuning {
  border-left: 3px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 12px;
}

.count {
  background: #d60027;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  margin-left: 4px;
  padding: 0 6px;
}
</style>
