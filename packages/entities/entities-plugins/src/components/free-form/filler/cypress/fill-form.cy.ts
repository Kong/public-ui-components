import { createFiller } from './create-filler'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import Form from '../../shared/Form.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import MapField from '../../shared/MapField.vue'
import ArrayField from '../../shared/ArrayField.vue'
import { h } from 'vue'

const FIELD_RENDERERS = 'free-form-field-renderers-slot' as const

describe('Filler - Cypress', () => {
  const basicSchema: FormSchema = {
    type: 'record',
    fields: [
      {
        name: {
          type: 'string',
          required: true,
        },
      },
      {
        enabled: {
          type: 'boolean',
          default: true,
        },
      },
      {
        port: {
          type: 'integer',
        },
      },
    ],
  }

  it('should fill string field', () => {
    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema: basicSchema })))

    const filler = createFiller(basicSchema)
    filler.fillField('name', 'test-name')

    cy.getTestId('ff-name').should('have.value', 'test-name')
  })

  it('should fill boolean field', () => {
    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema: basicSchema })))

    const filler = createFiller(basicSchema)
    filler.fillField('enabled', true)

    cy.getTestId('ff-enabled').should('be.checked')
  })

  it('should fill number field', () => {
    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema: basicSchema })))

    const filler = createFiller(basicSchema)
    filler.fillField('port', 8080)

    cy.getTestId('ff-port').should('have.value', '8080')
  })

  it('should fill multiple fields using fill method', () => {
    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema: basicSchema })))

    const filler = createFiller(basicSchema)
    filler.fill({
      name: 'my-service',
      enabled: true,
      port: 3000,
    })

    cy.getTestId('ff-name').should('have.value', 'my-service')
    cy.getTestId('ff-enabled').should('be.checked')
    cy.getTestId('ff-port').should('have.value', '3000')
  })

  describe('Complex fields', () => {
    it('should fill enum field (single select)', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            policy: {
              type: 'string',
              one_of: ['redis', 'local', 'cluster'],
              default: 'local',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('policy', 'redis')

      cy.getTestId('ff-policy').should('have.value', 'redis')
    })

    it('should fill multi-enum field (set with one_of)', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            protocols: {
              type: 'set',
              elements: {
                type: 'string',
                one_of: ['http', 'https', 'grpc', 'grpcs'],
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('protocols', ['http', 'grpc'])

      cy.getTestId('selection-badges-container').should('have.text', 'httpgrpc')
    })

    it('should fill tag field (set without one_of)', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            tags: {
              type: 'set',
              elements: {
                type: 'string',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('tags', ['tag1', 'tag2'])

      cy.getTestId('ff-tags').should('have.value', 'tag1,tag2')
    })

    it('should fill array field with primitive elements', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            hosts: {
              type: 'array',
              elements: {
                type: 'string',
              },
              default: ['a', 'b', 'c', 'd'],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('hosts', ['host1.com', 'host2.com'])

      cy.getTestId('ff-hosts.0').should('have.value', 'host1.com')
      cy.getTestId('ff-hosts.1').should('have.value', 'host2.com')
    })

    it('should fill record field (nested object)', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  host: {
                    type: 'string',
                  },
                },
                {
                  port: {
                    type: 'integer',
                  },
                },
              ],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('config', {
        host: 'localhost',
        port: 6379,
      })

      cy.get('[data-testid="ff-object-config"]').should('exist')
      cy.get('[data-testid="ff-config.host"]').should('have.value', 'localhost')
      cy.get('[data-testid="ff-config.port"]').should('have.value', '6379')
    })

    it('record: re-filling an already-enabled optional object does not collapse it', () => {
      // Companion to the playwright regression test: cypress's fillRecord already
      // uses .check()/.uncheck() (idempotent - no-op if already in that state),
      // so it doesn't have the playwright handler's bug (a plain .click() that
      // re-toggles, and thus collapses, an already-enabled object). Kept here as
      // regression coverage so it stays that way.
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            auth: {
              type: 'record',
              fields: [
                { username: { type: 'string' } },
                { password: { type: 'string' } },
              ],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)

      // First fill enables the switch from scratch (simulates create).
      filler.fillField('auth', { username: 'alice', password: 'secret1' })
      cy.get('[data-testid="ff-object-switch-auth"]').should('be.checked')
      cy.getTestId('ff-auth.username').should('have.value', 'alice')

      // Second fill (simulates editing an existing record): the object is
      // already enabled and must stay that way, with children still reachable.
      filler.fillField('auth', { username: 'bob', password: 'secret2' })
      cy.get('[data-testid="ff-object-switch-auth"]').should('be.checked')
      cy.getTestId('ff-auth.username').should('have.value', 'bob')
      cy.getTestId('ff-auth.password').should('have.value', 'secret2')
    })

    it('should fill map field (key-value pairs)', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            headers: {
              type: 'map',
              keys: {
                type: 'string',
              },
              values: {
                type: 'string',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('headers', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      })

      cy.get('[data-testid="ff-map-key-headers.0"]').should('have.value', 'Content-Type')
      cy.get('[data-testid="ff-map-container-headers.0"] [data-testid^="ff-headers.kid:"]').should('have.value', 'application/json')
      cy.get('[data-testid="ff-map-key-headers.1"]').should('have.value', 'Authorization')
      cy.get('[data-testid="ff-map-container-headers.1"] [data-testid^="ff-headers.kid:"]').should('have.value', 'Bearer token')
    })

    it('should clear existing map entries before refilling', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            headers: {
              type: 'map',
              keys: { type: 'string' },
              values: { type: 'string' },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('headers', { 'X-Old': 'old-value' })

      // Refill should clear previous entries first
      filler.fillField('headers', { 'X-New': 'new-value' })

      cy.get('[data-testid^="ff-map-container-headers"]').should('have.length', 1)
      cy.get('[data-testid="ff-map-key-headers.0"]').should('have.value', 'X-New')
      cy.get('[data-testid="ff-map-container-headers.0"] [data-testid^="ff-headers.kid:"]').should('have.value', 'new-value')
    })

    it('should fill map field with record values', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            plugins: {
              type: 'map',
              keys: { type: 'string' },
              values: {
                type: 'record',
                fields: [
                  {
                    name: {
                      type: 'string',
                    },
                  },
                  {
                    route: {
                      type: 'string',
                    },
                  },
                ],
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('plugins', {
        auth: {
          name: 'key-auth',
          route: '/auth',
        },
      })

      cy.get('[data-testid="ff-map-key-plugins.0"]').should('have.value', 'auth')
      cy.get('[data-testid="ff-map-container-plugins.0"] [data-testid^="ff-plugins.kid:"][data-testid$=".name"]').should('have.value', 'key-auth')
      cy.get('[data-testid="ff-map-container-plugins.0"] [data-testid^="ff-plugins.kid:"][data-testid$=".route"]').should('have.value', '/auth')
    })

    it('should fill multiline map field with both single-line and multiline values', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            functions: {
              type: 'map',
              keys: { type: 'string' },
              values: { type: 'string' },
            },
          },
        ],
      }

      cy.mount(() =>
        h('div', { style: 'padding: 20px' },
          h(Form, { schema }, {
            [FIELD_RENDERERS]: () => h(FieldRenderer,
              { match: ({ path }: { path: string }) => path === 'functions' },
              { default: (slotProps: any) => h(MapField, { ...slotProps, appearance: { string: { multiline: true } } }) },
            ),
          }),
        ),
      )

      const filler = createFiller(schema)
      filler.fillField('functions', {
        'single-line-fn': 'return kong.request.get_path()',
        'multi-line-fn': 'line1\nline2\nline3',
      })

      cy.get('[data-testid="ff-map-key-functions.0"]').should('have.value', 'single-line-fn')
      cy.get('[data-testid="ff-map-container-functions.0"] [data-testid^="ff-functions.kid:"]').should('have.value', 'return kong.request.get_path()')
      cy.get('[data-testid="ff-map-key-functions.1"]').should('have.value', 'multi-line-fn')
      cy.get('[data-testid="ff-map-container-functions.1"] [data-testid^="ff-functions.kid:"]').should('have.value', 'line1\nline2\nline3')
    })

    it('enum: scoped selection ignores identically-named options from other enum fields', () => {
      // Two enum fields each having 'openai' as a valid value — the old global
      // selector would match 2 elements and throw "can only be called on a single element".
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            format: {
              type: 'string',
              one_of: ['openai', 'ollama'],
              default: 'openai',
            },
          },
          {
            provider: {
              type: 'string',
              one_of: ['openai', 'cohere'],
              default: 'openai',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      // Selecting 'ollama' on the first field must not accidentally hit 'openai'
      // in the second field's popover.
      filler.fillField('format', 'ollama')
      filler.fillField('provider', 'cohere')

      cy.getTestId('ff-format').should('have.value', 'ollama')
      cy.getTestId('ff-provider').should('have.value', 'cohere')
    })

    it('array: add-item button click succeeds even when sticky tabs cover the button', () => {
      // The hosts array has default items; fillField adds new ones via the
      // add-item button. Cypress's default scrollBehavior ('top') would land
      // the button behind a sticky header; scrollIntoViewNative +
      // SCROLL_BEHAVIOR: 'center' avoids that collision without needing force.
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            hosts: {
              type: 'array',
              elements: {
                type: 'string',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('hosts', ['alpha.example.com', 'beta.example.com'])

      cy.getTestId('ff-hosts.0').should('have.value', 'alpha.example.com')
      cy.getTestId('ff-hosts.1').should('have.value', 'beta.example.com')
    })

    it('array: fills every item of a tab-appearance record array, not just the last-active tab', () => {
      // With appearance="tabs", only the active tab's fields are rendered
      // (see KTabs' per-tab v-if). Item 0's fields must still be reachable
      // and filled correctly even after later items switch the active tab away.
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            servers: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  { host: { type: 'string' } },
                ],
              },
            },
          },
        ],
      }

      cy.mount(() =>
        h('div', { style: 'padding: 20px' },
          h(Form, { schema }, {
            [FIELD_RENDERERS]: () => h(FieldRenderer,
              { match: ({ path }: { path: string }) => path === 'servers' },
              { default: (slotProps: any) => h(ArrayField as any, { ...slotProps, appearance: 'tabs' }) },
            ),
          }),
        ),
      )

      const filler = createFiller(schema)
      filler.fillField('servers', [
        { host: 'server-0.example.com' },
        { host: 'server-1.example.com' },
      ])

      cy.get('[data-testid="ff-array-tabs-servers"] .tab-item')
        .eq(0).click()
      cy.getTestId('ff-servers.0.host').should('have.value', 'server-0.example.com')
      cy.get('[data-testid="ff-array-tabs-servers"] .tab-item')
        .eq(1).click()
      cy.getTestId('ff-servers.1.host').should('have.value', 'server-1.example.com')
    })

    it('array: fills fields sitting right under a sticky tab header further down a long page', () => {
      // Reproduces a real failure: with stickyTabs, the tab header is
      // `position: sticky; top: 0`. Cypress's default scrollBehavior ('top')
      // scrolls the target flush against the viewport top, landing it right
      // behind that sticky header - "not visible ... covered by <ul role=tablist>".
      // scrollIntoViewNative + SCROLL_BEHAVIOR: 'center' avoids the collision entirely.
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            servers: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  { host: { type: 'string' } },
                ],
              },
            },
          },
        ],
      }

      cy.mount(() =>
        // Enough space above the array to force real scrolling once the
        // form is filled and the field is queried.
        h('div', { style: 'padding-top: 1200px; padding-bottom: 20px' },
          h(Form, { schema }, {
            [FIELD_RENDERERS]: () => h(FieldRenderer,
              { match: ({ path }: { path: string }) => path === 'servers' },
              { default: (slotProps: any) => h(ArrayField as any, { ...slotProps, appearance: 'tabs', stickyTabs: true }) },
            ),
          }),
        ),
      )

      const filler = createFiller(schema)
      filler.fillField('servers', [
        { host: 'server-0.example.com' },
        { host: 'server-1.example.com' },
      ])

      cy.getTestId('ff-servers.1.host').should('have.value', 'server-1.example.com')
    })

    it('array: fills a boolean field immediately after its optional parent object expands, further down a long page', () => {
      // Covers the exact shape of a real failure: a tab-appearance array item
      // containing an optional (switch-driven) nested object, whose boolean
      // child field is filled right after the switch expands it. Note: this
      // does NOT reliably reproduce the SlideTransition race itself (the
      // animation is too fast locally, and `uncheck()`'s own actionability
      // retry tends to absorb it) - it only asserts the correct end state.
      // The race was confirmed and fixed against a real failing GM run; this
      // test is here for basic structural coverage of the field shape, not
      // as a regression guard for the timing issue.
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            targets: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  {
                    auth: {
                      type: 'record',
                      fields: [
                        { allow_override: { type: 'boolean', default: true } },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      }

      cy.mount(() =>
        h('div', { style: 'padding-top: 1200px; padding-bottom: 20px' },
          h(Form, { schema }, {
            [FIELD_RENDERERS]: () => h(FieldRenderer,
              { match: ({ path }: { path: string }) => path === 'targets' },
              { default: (slotProps: any) => h(ArrayField as any, { ...slotProps, appearance: 'tabs', stickyTabs: true }) },
            ),
          }),
        ),
      )

      const filler = createFiller(schema)
      filler.fillField('targets', [
        { auth: { allow_override: false } },
      ])

      cy.getTestId('ff-targets.0.auth.allow_override').should('not.be.checked')
    })

    it('should fill json field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            metadata: {
              type: 'json',
              json_schema: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  nested: {
                    type: 'object',
                    properties: {
                      prop: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('metadata', { key: 'value', nested: { prop: 123 } })

      cy.get('[data-testid="ff-json-metadata"]').should('exist')
    })

    it('should fill entire form with nested data', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
            },
          },
          {
            config: {
              type: 'record',
              fields: [
                {
                  timeout: {
                    type: 'integer',
                  },
                },
                {
                  retry: {
                    type: 'boolean',
                  },
                },
              ],
            },
          },
          {
            tags: {
              type: 'set',
              elements: {
                type: 'string',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fill({
        name: 'my-plugin',
        config: {
          timeout: 5000,
          retry: true,
        },
        tags: ['production', 'v1'],
      })

      cy.get('[data-testid="ff-name"]').should('have.value', 'my-plugin')
      cy.get('[data-testid="ff-config.timeout"]').should('have.value', '5000')
      cy.get('[data-testid="ff-config.retry"]').should('be.checked')
    })

    it('should fill array of records', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            servers: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  {
                    host: {
                      type: 'string',
                    },
                  },
                  {
                    port: {
                      type: 'integer',
                    },
                  },
                ],
              },
              default: [{ host: '', port: 0 }, { host: '', port: 0 }],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('servers', [
        { host: 'localhost', port: 8080 },
        { host: '127.0.0.1', port: 3000 },
      ])

      cy.get('[data-testid="ff-servers.0.host"]').should('have.value', 'localhost')
      cy.get('[data-testid="ff-servers.0.port"]').should('have.value', '8080')
      cy.get('[data-testid="ff-servers.1.host"]').should('have.value', '127.0.0.1')
      cy.get('[data-testid="ff-servers.1.port"]').should('have.value', '3000')
    })

    it('should fill deeply nested structures', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            level1: {
              type: 'record',
              fields: [
                {
                  level2: {
                    type: 'record',
                    fields: [
                      {
                        level3: {
                          type: 'record',
                          fields: [
                            {
                              value: {
                                type: 'string',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fill({
        level1: {
          level2: {
            level3: {
              value: 'deeply-nested-value',
            },
          },
        },
      })

      cy.get('[data-testid="ff-level1.level2.level3.value"]').should('have.value', 'deeply-nested-value')
    })
  })

  describe('Null and undefined values', () => {
    it('should skip undefined field values', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
              default: 'default-name',
            },
          },
          {
            description: {
              type: 'string',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fill({
        name: undefined,
        description: 'test-description',
      })

      // undefined should not overwrite default
      cy.get('[data-testid="ff-name"]').should('have.value', 'default-name')
      cy.get('[data-testid="ff-description"]').should('have.value', 'test-description')
    })

    it('should handle null string field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
              default: 'initial-value',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('name', null)

      // null should clear the field
      cy.get('[data-testid="ff-name"]').should('have.value', '')
    })

    it('should handle null number field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            port: {
              type: 'integer',
              default: 8080,
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('port', null)

      cy.get('[data-testid="ff-port"]').should('have.value', '')
    })

    it('should handle null array field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            hosts: {
              type: 'array',
              elements: {
                type: 'string',
              },
              default: ['host1', 'host2'],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('hosts', null)

      // null array should result in empty array or no items
      cy.get('[data-testid="ff-hosts.0"]').should('not.exist')
    })

    it('should handle null record field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  host: {
                    type: 'string',
                  },
                },
              ],
              default: {
                host: 'default-host',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('config', null)

      // null record should not fill children
      cy.get('[data-testid="ff-config.host"]').should('not.exist')
    })

    it('should handle empty object for record field', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  host: {
                    type: 'string',
                    default: 'localhost',
                  },
                },
                {
                  port: {
                    type: 'integer',
                    default: 8080,
                  },
                },
              ],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('config', {})

      // empty object should not overwrite defaults
      cy.get('[data-testid="ff-config.host"]').should('have.value', 'localhost')
      cy.get('[data-testid="ff-config.port"]').should('have.value', '8080')
    })

    it('should handle empty array', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            hosts: {
              type: 'array',
              elements: {
                type: 'string',
              },
              default: ['host1', 'host2', 'host3'],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('hosts', [])

      // empty array should clear items
      cy.get('[data-testid="ff-hosts.0"]').should('not.exist')
    })

    it('should handle partial data in fill method', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
              default: 'default-name',
            },
          },
          {
            enabled: {
              type: 'boolean',
              default: false,
            },
          },
          {
            port: {
              type: 'integer',
              default: 3000,
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      // Only fill 'name', leave others with defaults
      filler.fill({
        name: 'my-service',
      })

      cy.get('[data-testid="ff-name"]').should('have.value', 'my-service')
      cy.get('[data-testid="ff-enabled"]').should('not.be.checked')
      cy.get('[data-testid="ff-port"]').should('have.value', '3000')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
              default: 'default-value',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('name', '')

      cy.get('[data-testid="ff-name"]').should('have.value', '')
    })

    it('should handle zero value', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            count: {
              type: 'integer',
              default: 10,
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('count', 0)

      cy.get('[data-testid="ff-count"]').should('have.value', '0')
    })

    it('should handle false boolean explicitly', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            enabled: {
              type: 'boolean',
              default: true,
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('enabled', false)

      cy.get('[data-testid="ff-enabled"]').should('not.be.checked')
    })

    it('should handle negative numbers', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            offset: {
              type: 'integer',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('offset', -100)

      cy.get('[data-testid="ff-offset"]').should('have.value', '-100')
    })

    it('should handle decimal numbers', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            ratio: {
              type: 'number',
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('ratio', 3.14159)

      cy.get('[data-testid="ff-ratio"]').should('have.value', '3.14159')
    })

    it('should handle array with single item', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            items: {
              type: 'array',
              elements: {
                type: 'string',
              },
              default: ['placeholder'],
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('items', ['only-one'])

      cy.get('[data-testid="ff-items.0"]').should('have.value', 'only-one')
      cy.get('[data-testid="ff-items.1"]').should('not.exist')
    })

    it('should handle map with special key characters', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            headers: {
              type: 'map',
              keys: {
                type: 'string',
              },
              values: {
                type: 'string',
              },
            },
          },
        ],
      }

      cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema })))

      const filler = createFiller(schema)
      filler.fillField('headers', {
        'X-Custom-Header': 'value1',
        'Content-Type': 'application/json',
      })

      cy.get('[data-testid="ff-map-headers"]').should('exist')
    })
  })
})
