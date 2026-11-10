import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { PluginConfigCardView } from '../index'

describe('<PluginConfigCardView />', () => {
  testConfigCardView('PluginConfigCardView', PluginConfigCardView, { record: { id: 'plugin', name: 'key-auth', config: { key_names: ['apikey'] } }, schema: { fields: [{ config: { type: 'record', fields: [{ key_names: { type: 'array', elements: { type: 'string' } } }] } }] } })

  it('renders placeholders for unassigned scopes and empty partials', () => {
    cy.mount(PluginConfigCardView, { props: {
      record: { id: 'plugin', name: 'key-auth', config: {}, service: null, route: null, consumer: null, consumer_group: null, partials: [] },
      schema: { fields: [{ config: { type: 'record', fields: [] } }] },
    } })

    for (const field of ['service', 'route', 'partials']) {
      cy.getTestId(`${field}-property-value`).should('have.text', '–')
    }
    cy.getTestId('consumer-property-value').should('not.exist')
    cy.getTestId('consumer_group-property-value').should('not.exist')
  })

  it('requires the Plugin schema and shows only matching association names', () => {
    const record = { id: 'plugin', name: 'key-auth', service: { id: 'service' }, config: { token: 'secret-token' } }
    const schema = Object.freeze({ fields: [{ config: { type: 'record', fields: [{ token: { type: 'string', encrypted: true } }] } }] })
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/services/:id', component: { template: '<div />' } },
    ] })
    cy.mount(PluginConfigCardView, { router, props: { record, schema, showNameAsLink: true } }).then(({ wrapper }) => {
      cy.getTestId('service-property-value').should('contain.text', 'service')
      cy.getTestId('token-property-value').should('not.contain.text', 'secret-token')
      cy.then(() => wrapper.setProps({ referenceEntities: { service: { id: 'service', name: 'resolved-name', to: '/services/service' } } }))
      cy.getTestId('service-property-value').should('contain.text', 'resolved-name')
      cy.getTestId('service-property-value').find('a').should('have.attr', 'href', '/services/service')
      cy.then(() => wrapper.setProps({ referenceEntities: { service: { id: 'other', name: 'stale-name' } } }))
      cy.getTestId('service-property-value').should('not.contain.text', 'stale-name')
      cy.then(() => wrapper.setProps({ schema: {} }))
      cy.getTestId('plugin-config-card-schema-error').should('contain.text', 'Error loading plugin schema')
      cy.get('.kong-ui-entity-base-config-card').should('not.exist')
    })
  })

  it('passes the resolved Plugin schema to the local Datakit canvas', () => {
    const schema = { fields: [{ config: { type: 'record', fields: [{ nodes: {
      type: 'array', elements: { type: 'record', fields: [], subschema_definitions: {
        call: { type: 'record', fields: [{ url: { type: 'string' } }, { continue_on_error: { type: 'boolean' } }] },
      } },
    } }] } }] }
    cy.mount(PluginConfigCardView, { props: {
      config: { app: 'konnect' }, schema,
      record: { id: 'datakit', name: 'datakit', config: { nodes: [{ name: 'CALL', type: 'call', url: 'https://example.com' }] } },
    } }).then(({ wrapper }) => {
      expect(wrapper.findComponent({ name: 'DatakitConfigCardCanvas' }).props('schema')).to.deep.equal(schema)
      cy.get('.dk-flow-node .name').should('contain.text', 'CALL')
      cy.then(() => wrapper.setProps({ record: {
        id: 'datakit', name: 'datakit', config: { nodes: [{ name: 'UPDATED', type: 'call', url: 'https://example.com' }] },
      } }))
      cy.get('.dk-flow-node .name').should('contain.text', 'UPDATED').and('not.contain.text', 'CALL')
    })
  })

  it('rebuilds the Datakit canvas only when schema capabilities change', () => {
    const schema = reactive({ fields: [{ config: { type: 'record', fields: [{ nodes: {
      type: 'array', elements: { type: 'record', fields: [], subschema_definitions: { call: { type: 'record', fields: [{ url: { type: 'string' } }] as Array<Record<string, any>> } } },
    } }] } }] })
    const record = { id: 'datakit', name: 'datakit', config: { nodes: [{ name: 'CALL', type: 'call', url: 'https://example.com' }] } }
    cy.mount(PluginConfigCardView, { props: { config: { app: 'konnect' }, schema, record } }).then(({ wrapper }) => {
      // Compare stable instance IDs: component proxies are not reliable identities
      const canvas = () => (wrapper.findComponent({ name: 'DatakitConfigCardCanvas' }).vm as any).$.uid as number
      let instance: number
      cy.get('.dk-flow-node .name').should('contain.text', 'CALL').then(() => {
        instance = canvas()
        // In-place capability change on the same schema object
        schema.fields[0].config.fields[0].nodes.elements.subschema_definitions.call.fields.push({ continue_on_error: { type: 'boolean' } })
      })
      cy.wrap(null).should(() => expect(canvas()).not.to.equal(instance)).then(() => {
        instance = canvas()
        // Equivalent schema object
        return wrapper.setProps({ schema: JSON.parse(JSON.stringify(schema)) })
      })
      cy.get('.dk-flow-node .name').should('contain.text', 'CALL').then(() => expect(canvas()).to.equal(instance))
    })
  })
})
