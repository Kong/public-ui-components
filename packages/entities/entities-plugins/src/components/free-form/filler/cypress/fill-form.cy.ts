import { createFiller } from './create-filler'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import Form from '../../shared/Form.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import ArrayField from '../../shared/ArrayField.vue'
import { FIELD_RENDERERS } from '../../shared/composables'
import { h, type Component } from 'vue'

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

  it('should handle custom action options', () => {
    cy.mount(() => h('div', { style: 'padding: 20px' }, h(Form, { schema: basicSchema })))

    const filler = createFiller(basicSchema)

    // First fill with a value
    filler.fillField('name', 'old-value')

    // Fill without clearing
    filler.fillField('name', 'new', { clear: false })

    cy.getTestId('ff-name').should('have.value', 'old-valuenew')
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

      cy.get('[data-testid="ff-kv-headers"]').should('exist')
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

      cy.get('[data-testid="ff-kv-headers"]').should('exist')
    })
  })

  describe('Tabs appearance array', () => {
    /**
     * Helper to mount a Form with specific array fields rendered as tabs.
     * Uses FieldRenderer to override the default ArrayField rendering with appearance="tabs".
     */
    function mountWithTabs(schema: FormSchema, tabFields: string[]) {
      cy.mount(() =>
        h('div', { style: 'padding: 20px' },
          h(Form, { schema, tag: 'div' }, {
            [FIELD_RENDERERS]: () =>
              tabFields.map(fieldName =>
                h(FieldRenderer, {
                  key: fieldName,
                  match: ({ path }: { path: string }) => path.endsWith(fieldName),
                }, {
                  default: ({ name }: { name: string }) =>
                    h(ArrayField as Component, { name, appearance: 'tabs' }),
                }),
              ),
          }),
        ),
      )
    }

    /** Click the nth tab button (0-based) within a tabs array field */
    function clickTab(fieldKey: string, index: number) {
      cy.get(`[data-testid="ff-array-tabs-${fieldKey}"] li button[role="tab"]`).eq(index).click()
    }

    it('should fill array of records with tabs appearance', () => {
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
            },
          },
        ],
      }

      mountWithTabs(schema, ['servers'])

      // Verify tabs container is rendered
      cy.get('[data-appearance="tabs"][data-testid="ff-array-servers"]').should('exist')

      const filler = createFiller(schema)
      filler.fillField('servers', [
        { host: 'localhost', port: 8080 },
        { host: '127.0.0.1', port: 3000 },
      ])

      // Switch to tab 0 to verify its values
      clickTab('servers', 0)
      cy.get('[data-testid="ff-servers.0.host"]').should('have.value', 'localhost')
      cy.get('[data-testid="ff-servers.0.port"]').should('have.value', '8080')

      // Switch to tab 1 to verify its values
      clickTab('servers', 1)
      cy.get('[data-testid="ff-servers.1.host"]').should('have.value', '127.0.0.1')
      cy.get('[data-testid="ff-servers.1.port"]').should('have.value', '3000')
    })

    it('should fill array of primitives with tabs appearance', () => {
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

      mountWithTabs(schema, ['hosts'])

      cy.get('[data-appearance="tabs"][data-testid="ff-array-hosts"]').should('exist')

      const filler = createFiller(schema)
      filler.fillField('hosts', ['host1.com', 'host2.com', 'host3.com'])

      // Switch to each tab to verify its value
      clickTab('hosts', 0)
      cy.get('[data-testid="ff-hosts.0"]').should('have.value', 'host1.com')

      clickTab('hosts', 1)
      cy.get('[data-testid="ff-hosts.1"]').should('have.value', 'host2.com')

      clickTab('hosts', 2)
      cy.get('[data-testid="ff-hosts.2"]').should('have.value', 'host3.com')
    })

    it('should clear existing tab items before filling', () => {
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
                ],
              },
              default: [{ host: 'old-host-1' }, { host: 'old-host-2' }],
            },
          },
        ],
      }

      mountWithTabs(schema, ['servers'])

      const filler = createFiller(schema)
      filler.fillField('servers', [
        { host: 'new-host' },
      ])

      // Should only have 1 item after fill
      cy.get('[data-testid="ff-servers.0.host"]').should('have.value', 'new-host')
      cy.get('[data-testid="ff-array-item-servers.1"]').should('not.exist')
    })

    it('should handle empty array in tabs appearance', () => {
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
                ],
              },
              default: [{ host: 'existing' }],
            },
          },
        ],
      }

      mountWithTabs(schema, ['servers'])

      const filler = createFiller(schema)
      filler.fillField('servers', [])

      // All items should be removed
      cy.get('[data-testid="ff-array-item-servers.0"]').should('not.exist')
    })

    it('should handle null array in tabs appearance', () => {
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
                ],
              },
              default: [{ host: 'existing' }],
            },
          },
        ],
      }

      mountWithTabs(schema, ['servers'])

      const filler = createFiller(schema)
      filler.fillField('servers', null)

      cy.get('[data-testid="ff-array-item-servers.0"]').should('not.exist')
    })

    it('should fill tabs with mixed field types in records', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            endpoints: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  {
                    url: {
                      type: 'string',
                    },
                  },
                  {
                    timeout: {
                      type: 'integer',
                    },
                  },
                  {
                    enabled: {
                      type: 'boolean',
                    },
                  },
                ],
              },
            },
          },
        ],
      }

      mountWithTabs(schema, ['endpoints'])

      const filler = createFiller(schema)
      filler.fillField('endpoints', [
        { url: 'https://api.example.com', timeout: 5000, enabled: true },
        { url: 'https://backup.example.com', timeout: 10000, enabled: false },
      ])

      // Switch to tab 0 to verify its values
      clickTab('endpoints', 0)
      cy.get('[data-testid="ff-endpoints.0.url"]').should('have.value', 'https://api.example.com')
      cy.get('[data-testid="ff-endpoints.0.timeout"]').should('have.value', '5000')
      cy.get('[data-testid="ff-endpoints.0.enabled"]').should('be.checked')

      // Switch to tab 1 to verify its values
      clickTab('endpoints', 1)
      cy.get('[data-testid="ff-endpoints.1.url"]').should('have.value', 'https://backup.example.com')
      cy.get('[data-testid="ff-endpoints.1.timeout"]').should('have.value', '10000')
      cy.get('[data-testid="ff-endpoints.1.enabled"]').should('not.be.checked')
    })

    it('should fill form with tabs array alongside other fields', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            name: {
              type: 'string',
            },
          },
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
            },
          },
          {
            enabled: {
              type: 'boolean',
            },
          },
        ],
      }

      mountWithTabs(schema, ['servers'])

      const filler = createFiller(schema)
      filler.fill({
        name: 'my-service',
        servers: [
          { host: 'primary.example.com', port: 443 },
        ],
        enabled: true,
      })

      cy.get('[data-testid="ff-name"]').should('have.value', 'my-service')

      // Switch to the server tab to verify its values
      clickTab('servers', 0)
      cy.get('[data-testid="ff-servers.0.host"]').should('have.value', 'primary.example.com')
      cy.get('[data-testid="ff-servers.0.port"]').should('have.value', '443')

      cy.get('[data-testid="ff-enabled"]').should('be.checked')
    })
  })
})
