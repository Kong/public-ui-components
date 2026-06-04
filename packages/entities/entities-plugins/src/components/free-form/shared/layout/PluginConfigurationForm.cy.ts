import { h } from 'vue'
import PluginConfigurationForm from './PluginConfigurationForm.vue'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../../../../constants'

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
})

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
  it('renders the reusable plugin configuration block with default copy', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps(),
      slots: {
        default: () => h('div', { 'data-testid': 'plugin-config-fields' }, 'Plugin config fields'),
      },
    })

    cy.getTestId('form-section-plugin-config').should('exist')
    cy.getTestId('form-section-plugin-config').should('contain.text', 'Plugin configuration')
    cy.getTestId('form-section-plugin-config').should('contain.text', 'Set the plugin\'s behavior')
    cy.getTestId('plugin-config-fields').should('contain.text', 'Plugin config fields')
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

  it('forwards plugin configuration named slots', () => {
    cy.mount(PluginConfigurationForm as any, {
      props: createProps(),
      slots: {
        default: () => h('div', 'Plugin config fields'),
        'plugin-config-title': () => h('span', { 'data-testid': 'custom-config-title' }, 'Custom config title'),
        'plugin-config-description': () => h('span', { 'data-testid': 'custom-config-description' }, 'Custom config description'),
        'plugin-config-extra': () => h('button', { 'data-testid': 'custom-config-extra' }, 'Extra action'),
      },
    })

    cy.getTestId('custom-config-title').should('contain.text', 'Custom config title')
    cy.getTestId('custom-config-description').should('contain.text', 'Custom config description')
    cy.getTestId('custom-config-extra').should('contain.text', 'Extra action')
  })
})
