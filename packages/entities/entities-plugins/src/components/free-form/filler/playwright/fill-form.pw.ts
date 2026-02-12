import { test, expect } from '@playwright/experimental-ct-vue'
import { createFiller } from './create-filler'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import FormWrapper from './FormWrapper.vue'
import FormWrapperWithTabs from './FormWrapperWithTabs.vue'
import type { Page } from '@playwright/test'


test.describe('Filler - Playwright', () => {
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

  test('should fill string field', async ({ mount, page }) => {
    await mount(FormWrapper, { props: { schema: basicSchema } })

    const filler = createFiller(page, basicSchema)
    await filler.fillField('name', 'test-name')

    await expect(page.getByTestId('ff-name')).toHaveValue('test-name')
  })

  test('should fill boolean field', async ({ mount, page }) => {
    await mount(FormWrapper, { props: { schema: basicSchema } })

    const filler = createFiller(page, basicSchema)
    await filler.fillField('enabled', true)

    await expect(page.getByTestId('ff-enabled')).toBeChecked()
  })

  test('should fill number field', async ({ mount, page }) => {
    await mount(FormWrapper, { props: { schema: basicSchema } })

    const filler = createFiller(page, basicSchema)
    await filler.fillField('port', 8080)

    await expect(page.getByTestId('ff-port')).toHaveValue('8080')
  })

  test('should fill multiple fields using fill method', async ({ mount, page }) => {
    await mount(FormWrapper, { props: { schema: basicSchema } })

    const filler = createFiller(page, basicSchema)
    await filler.fill({
      name: 'my-service',
      enabled: true,
      port: 3000,
    })

    await expect(page.getByTestId('ff-name')).toHaveValue('my-service')
    await expect(page.getByTestId('ff-enabled')).toBeChecked()
    await expect(page.getByTestId('ff-port')).toHaveValue('3000')
  })

  test.describe('Complex fields', () => {
    test('should fill enum field (single select)', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('policy', 'redis')

      await expect(page.getByTestId('ff-policy')).toHaveValue('redis')
    })

    test('should fill multi-enum field (set with one_of)', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('protocols', ['http', 'grpc'])

      await expect(page.getByTestId('selection-badges-container')).toHaveText('httpgrpc')
    })

    test('should fill tag field (set without one_of)', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('tags', ['tag1', 'tag2'])

      await expect(page.getByTestId('ff-tags')).toHaveValue('tag1,tag2')
    })

    test('should fill array field with primitive elements', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('hosts', ['host1.com', 'host2.com'])

      await expect(page.getByTestId('ff-hosts.0')).toHaveValue('host1.com')
      await expect(page.getByTestId('ff-hosts.1')).toHaveValue('host2.com')
    })

    test('should fill record field (nested object)', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('config', {
        host: 'localhost',
        port: 6379,
      })

      await expect(page.locator('[data-testid="ff-object-config"]')).toBeVisible()
      await expect(page.locator('[data-testid="ff-config.host"]')).toHaveValue('localhost')
      await expect(page.locator('[data-testid="ff-config.port"]')).toHaveValue('6379')
    })

    test('should fill map field (key-value pairs)', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('headers', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      })

      await expect(page.locator('[data-testid="ff-kv-headers"]')).toBeVisible()
    })

    test('should fill json field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('metadata', { key: 'value', nested: { prop: 123 } })

      await expect(page.locator('[data-testid="ff-json-metadata"]')).toBeVisible()
    })

    test('should fill entire form with nested data', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fill({
        name: 'my-plugin',
        config: {
          timeout: 5000,
          retry: true,
        },
        tags: ['production', 'v1'],
      })

      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('my-plugin')
      await expect(page.locator('[data-testid="ff-config.timeout"]')).toHaveValue('5000')
      await expect(page.locator('[data-testid="ff-config.retry"]')).toBeChecked()
    })

    test('should fill array of records', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('servers', [
        { host: 'localhost', port: 8080 },
        { host: '127.0.0.1', port: 3000 },
      ])

      await expect(page.locator('[data-testid="ff-servers.0.host"]')).toHaveValue('localhost')
      await expect(page.locator('[data-testid="ff-servers.0.port"]')).toHaveValue('8080')
      await expect(page.locator('[data-testid="ff-servers.1.host"]')).toHaveValue('127.0.0.1')
      await expect(page.locator('[data-testid="ff-servers.1.port"]')).toHaveValue('3000')
    })

    test('should fill deeply nested structures', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fill({
        level1: {
          level2: {
            level3: {
              value: 'deeply-nested-value',
            },
          },
        },
      })

      await expect(page.locator('[data-testid="ff-level1.level2.level3.value"]')).toHaveValue('deeply-nested-value')
    })
  })

  test.describe('Null and undefined values', () => {
    test('should skip undefined field values', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fill({
        name: undefined,
        description: 'test-description',
      })

      // undefined should not overwrite default
      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('default-name')
      await expect(page.locator('[data-testid="ff-description"]')).toHaveValue('test-description')
    })

    test('should handle null string field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('name', null)

      // null should clear the field
      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('')
    })

    test('should handle null number field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('port', null)

      await expect(page.locator('[data-testid="ff-port"]')).toHaveValue('')
    })

    test('should handle null array field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('hosts', null)

      // null array should result in empty array or no items
      await expect(page.locator('[data-testid="ff-hosts.0"]')).not.toBeVisible()
    })

    test('should handle null record field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('config', null)

      // null record should not fill children
      await expect(page.locator('[data-testid="ff-config.host"]')).not.toBeVisible()
    })

    test('should handle empty object for record field', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('config', {})

      // empty object should not overwrite defaults
      await expect(page.locator('[data-testid="ff-config.host"]')).toHaveValue('localhost')
      await expect(page.locator('[data-testid="ff-config.port"]')).toHaveValue('8080')
    })

    test('should handle empty array', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('hosts', [])

      // empty array should clear items
      await expect(page.locator('[data-testid="ff-hosts.0"]')).not.toBeVisible()
    })

    test('should handle partial data in fill method', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      // Only fill 'name', leave others with defaults
      await filler.fill({
        name: 'my-service',
      })

      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('my-service')
      await expect(page.locator('[data-testid="ff-enabled"]')).not.toBeChecked()
      await expect(page.locator('[data-testid="ff-port"]')).toHaveValue('3000')
    })
  })

  test.describe('Edge cases', () => {
    test('should handle empty string', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('name', '')

      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('')
    })

    test('should handle zero value', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('count', 0)

      await expect(page.locator('[data-testid="ff-count"]')).toHaveValue('0')
    })

    test('should handle false boolean explicitly', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('enabled', false)

      await expect(page.locator('[data-testid="ff-enabled"]')).not.toBeChecked()
    })

    test('should handle negative numbers', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('offset', -100)

      await expect(page.locator('[data-testid="ff-offset"]')).toHaveValue('-100')
    })

    test('should handle decimal numbers', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('ratio', 3.14159)

      await expect(page.locator('[data-testid="ff-ratio"]')).toHaveValue('3.14159')
    })

    test('should handle array with single item', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('items', ['only-one'])

      await expect(page.locator('[data-testid="ff-items.0"]')).toHaveValue('only-one')
      await expect(page.locator('[data-testid="ff-items.1"]')).not.toBeVisible()
    })

    test('should handle map with special key characters', async ({ mount, page }) => {
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

      await mount(FormWrapper, { props: { schema } })

      const filler = createFiller(page, schema)
      await filler.fillField('headers', {
        'X-Custom-Header': 'value1',
        'Content-Type': 'application/json',
      })

      await expect(page.locator('[data-testid="ff-kv-headers"]')).toBeVisible()
    })
  })

  test.describe('Tabs appearance array', () => {
    /** Click the nth tab button (0-based) within a tabs array field */
    async function clickTab(page: Page, fieldKey: string, index: number) {
      await page.locator(`[data-testid="ff-array-tabs-${fieldKey}"] li button[role="tab"]`).nth(index).click()
    }

    test('should fill array of records with tabs appearance', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['servers'] },
      })

      // Verify tabs container is rendered
      await expect(page.locator('[data-appearance="tabs"][data-testid="ff-array-servers"]')).toBeVisible()

      const filler = createFiller(page, schema)
      await filler.fillField('servers', [
        { host: 'localhost', port: 8080 },
        { host: '127.0.0.1', port: 3000 },
      ])

      // Switch to tab 0 to verify its values
      await clickTab(page, 'servers', 0)
      await expect(page.locator('[data-testid="ff-servers.0.host"]')).toHaveValue('localhost')
      await expect(page.locator('[data-testid="ff-servers.0.port"]')).toHaveValue('8080')

      // Switch to tab 1 to verify its values
      await clickTab(page, 'servers', 1)
      await expect(page.locator('[data-testid="ff-servers.1.host"]')).toHaveValue('127.0.0.1')
      await expect(page.locator('[data-testid="ff-servers.1.port"]')).toHaveValue('3000')
    })

    test('should fill array of primitives with tabs appearance', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['hosts'] },
      })

      await expect(page.locator('[data-appearance="tabs"][data-testid="ff-array-hosts"]')).toBeVisible()

      const filler = createFiller(page, schema)
      await filler.fillField('hosts', ['host1.com', 'host2.com', 'host3.com'])

      // Switch to each tab to verify its value
      await clickTab(page, 'hosts', 0)
      await expect(page.locator('[data-testid="ff-hosts.0"]')).toHaveValue('host1.com')

      await clickTab(page, 'hosts', 1)
      await expect(page.locator('[data-testid="ff-hosts.1"]')).toHaveValue('host2.com')

      await clickTab(page, 'hosts', 2)
      await expect(page.locator('[data-testid="ff-hosts.2"]')).toHaveValue('host3.com')
    })

    test('should clear existing tab items before filling', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['servers'] },
      })

      const filler = createFiller(page, schema)
      await filler.fillField('servers', [
        { host: 'new-host' },
      ])

      // Should only have 1 item after fill
      await expect(page.locator('[data-testid="ff-servers.0.host"]')).toHaveValue('new-host')
      await expect(page.locator('[data-testid="ff-array-item-servers.1"]')).not.toBeVisible()
    })

    test('should handle empty array in tabs appearance', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['servers'] },
      })

      const filler = createFiller(page, schema)
      await filler.fillField('servers', [])

      // All items should be removed
      await expect(page.locator('[data-testid="ff-array-item-servers.0"]')).not.toBeVisible()
    })

    test('should handle null array in tabs appearance', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['servers'] },
      })

      const filler = createFiller(page, schema)
      await filler.fillField('servers', null)

      await expect(page.locator('[data-testid="ff-array-item-servers.0"]')).not.toBeVisible()
    })

    test('should fill tabs with mixed field types in records', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['endpoints'] },
      })

      const filler = createFiller(page, schema)
      await filler.fillField('endpoints', [
        { url: 'https://api.example.com', timeout: 5000, enabled: true },
        { url: 'https://backup.example.com', timeout: 10000, enabled: false },
      ])

      // Switch to tab 0 to verify its values
      await clickTab(page, 'endpoints', 0)
      await expect(page.locator('[data-testid="ff-endpoints.0.url"]')).toHaveValue('https://api.example.com')
      await expect(page.locator('[data-testid="ff-endpoints.0.timeout"]')).toHaveValue('5000')
      await expect(page.locator('[data-testid="ff-endpoints.0.enabled"]')).toBeChecked()

      // Switch to tab 1 to verify its values
      await clickTab(page, 'endpoints', 1)
      await expect(page.locator('[data-testid="ff-endpoints.1.url"]')).toHaveValue('https://backup.example.com')
      await expect(page.locator('[data-testid="ff-endpoints.1.timeout"]')).toHaveValue('10000')
      await expect(page.locator('[data-testid="ff-endpoints.1.enabled"]')).not.toBeChecked()
    })

    test('should fill form with tabs array alongside other fields', async ({ mount, page }) => {
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

      await mount(FormWrapperWithTabs, {
        props: { schema, tabFields: ['servers'] },
      })

      const filler = createFiller(page, schema)
      await filler.fill({
        name: 'my-service',
        servers: [
          { host: 'primary.example.com', port: 443 },
        ],
        enabled: true,
      })

      await expect(page.locator('[data-testid="ff-name"]')).toHaveValue('my-service')

      // Switch to the server tab to verify its values
      await clickTab(page, 'servers', 0)
      await expect(page.locator('[data-testid="ff-servers.0.host"]')).toHaveValue('primary.example.com')
      await expect(page.locator('[data-testid="ff-servers.0.port"]')).toHaveValue('443')

      await expect(page.locator('[data-testid="ff-enabled"]')).toBeChecked()
    })
  })
})
