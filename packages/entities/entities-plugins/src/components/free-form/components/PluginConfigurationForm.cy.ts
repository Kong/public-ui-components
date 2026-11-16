import { h } from 'vue'
import PluginConfigurationForm from './PluginConfigurationForm.vue'
import { getPluginConfig } from '../plugin-registry'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../../../constants'
import type { FormSchema } from '@kong-ui-public/freeform'

const createSchema = () => ({
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [],
      },
    },
    {
      enabled: {
        type: 'boolean',
        default: true,
      },
    },
  ],
} as FormSchema)

/**
 * The Kafka Log config schema as the AI Gateway API returns it: `bootstrap_servers`
 * is a `set` of records, and the plugin's field renderer shows it as an array.
 */
const createKafkaLogSchema = () => ({
  type: 'record',
  fields: [
    {
      config: {
        type: 'record',
        fields: [
          {
            bootstrap_servers: {
              type: 'set',
              elements: {
                type: 'record',
                fields: [
                  { host: { type: 'string', required: true } },
                  { port: { type: 'integer', required: true } },
                ],
              },
            },
          },
        ],
      },
    },
  ],
} as FormSchema)

const createProps = (overrides: Record<string, any> = {}) => ({
  schema: createSchema(),
  model: {
    enabled: true,
    config: {},
    ignored: 'not-controlled',
  },
  controlledFields: ['config', 'enabled'],
  onFormChange: cy.spy().as('onFormChange'),
  pluginName: 'test-plugin',
  ...overrides,
})

describe('<PluginConfigurationForm />', () => {
  it('renders schema fields when no default slot is provided', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps(),
    })

    cy.getTestId('ff-enabled').should('exist')
  })

  it('uses caller default slot when provided', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps(),
      slots: {
        default: () => h('div', { 'data-testid': 'plugin-config-fields' }, 'Plugin config fields'),
      },
    })

    cy.getTestId('plugin-config-fields').should('contain.text', 'Plugin config fields')
    cy.getTestId('ff-enabled').should('not.exist')
  })

  it('forwards attrs to the underlying form and exposes the schema', () => {
    const Host = {
      name: 'PluginConfigurationFormHost',
      setup() {
        return () => h(PluginConfigurationForm as any, {
          ...createProps(),
          class: 'custom-layout-class',
          'data-testid': 'custom-plugin-configuration-form',
        })
      },
    }

    cy.mount(Host as any)

    cy.getTestId('custom-plugin-configuration-form')
      .should('have.class', 'ff-plugin-configuration-form')
      .and('have.class', 'custom-layout-class')
      .invoke('attr', 'data-instance-id')
      .then((instanceId) => {
        cy.window().then((win) => {
          const map = (win as any)[FREE_FORM_SCHEMA_MAP_KEY]
          expect(map[instanceId as string].fields).to.have.length(2)
        })
      })
  })

  it('renders config sets as arrays', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps({
        schema: {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { names: { type: 'set', elements: { type: 'string' } } },
                  { methods: { type: 'set', elements: { type: 'string', one_of: ['GET', 'POST'] } } },
                ],
              },
            },
          ],
        } as FormSchema,
      }),
    })

    cy.getTestId('ff-array-config.names').should('exist')
    // A set with `one_of` elements keeps rendering as a multi-select
    cy.getTestId('ff-array-config.methods').should('not.exist')
  })

  it('renders the fields of a set of records shown as an array', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps({
        schema: createKafkaLogSchema(),
        model: {
          enabled: true,
          config: {
            bootstrap_servers: [{ host: 'kafka.example.com', port: 9093 }],
          },
        },
        fieldRenderers: getPluginConfig('kafka-log')!.fieldRenderers,
      }),
    })

    cy.getTestId('ff-array-config.bootstrap_servers').should('exist')
    cy.getTestId('ff-config.bootstrap_servers.0.host').should('exist')
    cy.getTestId('ff-config.bootstrap_servers.0.port').should('exist')
  })

})
