import { h } from 'vue'
import PluginConfigurationForm from './PluginConfigurationForm.vue'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../../../../constants'
import type { FormSchema } from 'src/types/plugins/form-schema.ts'

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

})
