// Cypress component test focused on PluginEntityForm's strip-unknown-config-fields behavior.
// `shorthand_fields` are deprecated aliases the backend keeps in sync with canonical fields;
// re-submitting them on edit would let Kong's alias handler overwrite the canonical change
// (e.g. clearing `redis.password` is undone by a leftover `redis_password`).
import type { Router } from 'vue-router'
import { createMemoryHistory, createRouter } from 'vue-router'
import PluginEntityForm from './PluginEntityForm.vue'
import schemaNestedMixed from '../../fixtures/schemas/nested-mixed'
import schemaOpentelemetry from '../../fixtures/schemas/opentelemetry'
import schemaRateLimiting from '../../fixtures/schemas/rate-limiting'
import type { KonnectPluginFormConfig } from '../types'

const baseConfig: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'cp-test',
  cancelRoute: { name: 'home' },
}

// Minimal `props.schema` so `parseSchema` produces `model.name`, which lets
// `syncFormRenderingMode` resolve the freeform branch. The strip filter itself
// reads from `props.rawSchema`, not this.
const buildPropSchema = (pluginName: string) => ({
  name: {
    default: pluginName,
    type: 'input',
    inputType: 'hidden',
    model: 'name',
  },
  enabled: {
    default: true,
    type: 'switch',
    model: 'enabled',
  },
})

const mountForm = (opts: {
  pluginName: string
  rawSchema: Record<string, any>
  record: Record<string, any>
  editing?: boolean
  router: Router
}) => {
  cy.mount(PluginEntityForm, {
    props: {
      config: baseConfig,
      record: opts.record,
      schema: buildPropSchema(opts.pluginName),
      rawSchema: opts.rawSchema,
      editing: opts.editing ?? true,
      engine: 'freeform',
      onModelUpdated: cy.spy().as('modelUpdatedSpy'),
    },
    router: opts.router,
  })
}

// Returns the `data` field of the most recent `model-updated` emit — the payload
// that would be POSTed to Kong on submit.
const lastEmittedConfig = (): Cypress.Chainable<Record<string, any>> =>
  cy.get('@modelUpdatedSpy').then((spy: any) => spy.lastCall.args[0].data)

describe('<PluginEntityForm /> — shorthand_fields stripping', () => {
  let router: Router

  beforeEach(() => {
    router = createRouter({
      routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
      history: createMemoryHistory(),
    })
  })

  // ============================================================
  // Scenario A: creation flow — record carries no shorthand keys
  //   The user authored only canonical fields. The payload should mirror the
  //   record exactly; no shorthand should be invented.
  // ============================================================
  describe('creation flow (no shorthand in record)', () => {
    it('opentelemetry — payload mirrors record exactly', () => {
      const record = {
        name: 'opentelemetry',
        enabled: true,
        config: {
          traces_endpoint: 'https://otel.example.com/v1/traces',
          logs_endpoint: 'https://otel.example.com/v1/logs',
          headers: { 'x-team': 'platform' },
          access_logs: {
            endpoint: 'https://otel.example.com/v1/logs',
          },
        },
      }

      mountForm({
        pluginName: 'opentelemetry',
        rawSchema: schemaOpentelemetry,
        record,
        editing: false,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.config).to.deep.equal(record.config)
        // The fixture's shorthand_fields (`endpoint`, `access_logs_endpoint`) were never set,
        // so they must not appear in the payload.
        expect(data.config).to.not.have.property('endpoint')
        expect(data.config).to.not.have.property('access_logs_endpoint')
      })
    })

    it('rate-limiting — canonical redis fields preserved, no shorthand fabricated', () => {
      const record = {
        name: 'rate-limiting',
        enabled: true,
        config: {
          minute: 60,
          policy: 'redis',
          redis: {
            host: 'redis.example.com',
            port: 6379,
            password: 'secret',
            timeout: 2000,
          },
        },
      }

      mountForm({
        pluginName: 'rate-limiting',
        rawSchema: schemaRateLimiting,
        record,
        editing: false,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.config.redis).to.deep.equal(record.config.redis)
        // None of the top-of-config shorthand aliases were authored — they must not appear.
        expect(data.config).to.not.have.property('redis_host')
        expect(data.config).to.not.have.property('redis_port')
        expect(data.config).to.not.have.property('redis_password')
        expect(data.config).to.not.have.property('redis_username')
        expect(data.config).to.not.have.property('redis_ssl')
      })
    })
  })

  // ============================================================
  // Scenario B: editing flow — backend echoed canonical + shorthand
  //   The record carries both forms. The filter must drop every shorthand
  //   while preserving every canonical field (including ones the user is
  //   about to change).
  // ============================================================
  describe('editing flow (shorthand keys present in record)', () => {
    it('rate-limiting — strips top-of-config redis_* aliases, keeps redis.* canonical', () => {
      // Simulates an existing plugin whose backend record includes both the canonical redis
      // sub-record and the deprecated top-level aliases the backend maintains for compatibility.
      const record = {
        name: 'rate-limiting',
        enabled: true,
        config: {
          minute: 60,
          policy: 'redis',
          redis: {
            host: 'redis.example.com',
            port: 6379,
            username: 'rl-user',
            password: 'kept-secret',
            ssl: true,
          },
          // Deprecated aliases — the backend keeps these in sync with `redis.*` above.
          // Re-submitting them would let the backend re-fill `redis.password` from this stale value.
          redis_host: 'redis.example.com',
          redis_port: 6379,
          redis_username: 'rl-user',
          redis_password: 'kept-secret',
          redis_ssl: true,
        },
      }

      mountForm({
        pluginName: 'rate-limiting',
        rawSchema: schemaRateLimiting,
        record,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.config).to.not.have.property('redis_host')
        expect(data.config).to.not.have.property('redis_port')
        expect(data.config).to.not.have.property('redis_username')
        expect(data.config).to.not.have.property('redis_password')
        expect(data.config).to.not.have.property('redis_ssl')
        expect(data.config.redis).to.deep.equal({
          host: 'redis.example.com',
          port: 6379,
          username: 'rl-user',
          password: 'kept-secret',
          ssl: true,
        })
      })
    })

    it('opentelemetry — strips deprecated `endpoint` and `access_logs_endpoint` while preserving canonical', () => {
      const record = {
        name: 'opentelemetry',
        enabled: true,
        config: {
          traces_endpoint: 'https://otel.example.com/v1/traces',
          logs_endpoint: 'https://otel.example.com/v1/logs',
          access_logs: {
            endpoint: 'https://otel.example.com/v1/logs',
          },
          // Deprecated aliases echoed back by the backend.
          endpoint: 'https://legacy.example.com/v1/traces',
          access_logs_endpoint: 'https://legacy.example.com/v1/logs',
        },
      }

      mountForm({
        pluginName: 'opentelemetry',
        rawSchema: schemaOpentelemetry,
        record,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.config).to.not.have.property('endpoint')
        expect(data.config).to.not.have.property('access_logs_endpoint')
        expect(data.config.traces_endpoint).to.equal('https://otel.example.com/v1/traces')
        expect(data.config.logs_endpoint).to.equal('https://otel.example.com/v1/logs')
        expect(data.config.access_logs).to.deep.equal({
          endpoint: 'https://otel.example.com/v1/logs',
        })
      })
    })

    it('leaves top-level (non-config) fields untouched even when config carries shorthand', () => {
      const record = {
        name: 'opentelemetry',
        enabled: false,
        tags: ['team-a', 'observability'],
        protocols: ['http', 'https'],
        config: {
          traces_endpoint: 'https://otel.example.com/v1/traces',
          endpoint: 'https://legacy/v1/traces', // shorthand → dropped
        },
      }

      mountForm({
        pluginName: 'opentelemetry',
        rawSchema: schemaOpentelemetry,
        record,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.enabled).to.equal(false)
        expect(data.tags).to.deep.equal(['team-a', 'observability'])
        expect(data.protocols).to.deep.equal(['http', 'https'])
        expect(data.config).to.not.have.property('endpoint')
        expect(data.config.traces_endpoint).to.equal('https://otel.example.com/v1/traces')
      })
    })

    it('deeply nested schema — strips shorthand at every depth, preserves every canonical leaf', () => {
      // Synthetic schema (`nested-mixed`) puts shorthand_fields at:
      //   - top of config                         (`legacy_alias`)
      //   - inside outer.inner                    (`legacy_inner`)
      //   - inside outer.inner.deep               (`legacy_deep`)
      //   - inside each outer.inner.entries[]    (`legacy_alias`)
      //   - inside each targets[].auth            (`legacy_token`)
      const record = {
        name: 'nested-mixed',
        enabled: true,
        config: {
          // Shorthand at the top of config — must disappear.
          legacy_alias: 'should-not-be-submitted',

          // record → record → record → array (of records w/ shorthand)
          //         + record → record → record (deep leaf w/ shorthand sibling)
          //         + map field at deep nesting (arbitrary user keys, passes through)
          outer: {
            inner: {
              legacy_inner: 'drop-me',
              entries: [
                { key: 'k1', value: 'v1', legacy_alias: 'drop-element-1' },
                { key: 'k2', value: 'v2', legacy_alias: 'drop-element-2' },
              ],
              deep: {
                value: 'kept',
                legacy_deep: 'drop-me',
              },
              // Map keys happen to share names with shorthand aliases used elsewhere —
              // must NOT be filtered because user-defined map keys are opaque to the schema.
              metadata: {
                legacy_alias: 'user-supplied-keep',
                team: 'platform',
                version: 'v2',
              },
            },
          },

          // record → array (of records) → record → array (of primitives)
          // + shorthand inside the auth record (which itself lives inside an array element)
          targets: [
            {
              url: '/api1',
              auth: {
                header_name: 'X-Token',
                allowed_scopes: ['read', 'write'],
                headers: { 'x-trace-id': 'abc', 'x-team': 'platform' },
                legacy_token: 'drop-me',
              },
            },
            {
              url: '/api2',
              auth: {
                header_name: 'X-Other',
                allowed_scopes: ['read'],
                headers: { 'x-trace-id': 'xyz' },
                legacy_token: 'drop-me-too',
              },
            },
          ],

          // record → array (of records) → array (of records) — no shorthand here,
          // verifies the structure survives recursion intact.
          pipelines: [
            {
              id: 'p1',
              steps: [
                { name: 's1', kind: 'transform' },
                { name: 's2', kind: 'forward' },
              ],
            },
          ],
        },
      }

      mountForm({
        pluginName: 'nested-mixed',
        rawSchema: schemaNestedMixed,
        record,
        router,
      })

      lastEmittedConfig().then((data) => {
        // Top-of-config shorthand dropped.
        expect(data.config).to.not.have.property('legacy_alias')

        // record → record → record path: shorthand at every level dropped, canonical kept.
        expect(data.config.outer.inner).to.not.have.property('legacy_inner')
        expect(data.config.outer.inner.deep).to.deep.equal({ value: 'kept' })

        // Map at deep nesting passes through verbatim — including a key that *coincidentally*
        // matches a shorthand alias name (`legacy_alias`). User-defined map keys are opaque.
        expect(data.config.outer.inner.metadata).to.deep.equal({
          legacy_alias: 'user-supplied-keep',
          team: 'platform',
          version: 'v2',
        })

        // Each array element keeps its canonical keys; per-element shorthand stripped.
        expect(data.config.outer.inner.entries).to.deep.equal([
          { key: 'k1', value: 'v1' },
          { key: 'k2', value: 'v2' },
        ])

        // record → array (of records) → record: shorthand inside the inner record stripped,
        // primitive array + map inside it preserved.
        expect(data.config.targets).to.deep.equal([
          {
            url: '/api1',
            auth: {
              header_name: 'X-Token',
              allowed_scopes: ['read', 'write'],
              headers: { 'x-trace-id': 'abc', 'x-team': 'platform' },
            },
          },
          {
            url: '/api2',
            auth: {
              header_name: 'X-Other',
              allowed_scopes: ['read'],
              headers: { 'x-trace-id': 'xyz' },
            },
          },
        ])

        // record → array → array — deeply nested arrays of records preserved end-to-end.
        expect(data.config.pipelines).to.deep.equal([
          {
            id: 'p1',
            steps: [
              { name: 's1', kind: 'transform' },
              { name: 's2', kind: 'forward' },
            ],
          },
        ])
      })
    })

    it('is a no-op when rawSchema is empty — payload identical to record', () => {
      // Without a schema we cannot distinguish shorthand from canonical, so the filter falls
      // back to passing the record through unchanged. This guards against breaking unknown-shape
      // payloads (e.g. test setups or schema-load races).
      const record = {
        name: 'opentelemetry',
        enabled: true,
        config: {
          endpoint: 'https://legacy/v1/traces',
          traces_endpoint: 'https://otel/v1/traces',
        },
      }

      mountForm({
        pluginName: 'opentelemetry',
        rawSchema: {},
        record,
        router,
      })

      lastEmittedConfig().then((data) => {
        expect(data.config).to.have.property('endpoint', 'https://legacy/v1/traces')
        expect(data.config).to.have.property('traces_endpoint', 'https://otel/v1/traces')
      })
    })
  })
})
