import { h, type Component } from 'vue'
import { ConsumerConfigCardView } from '@kong-ui-public/entities-consumers'
import { ConsumerGroupConfigCardView } from '@kong-ui-public/entities-consumer-groups'
import { GatewayServiceConfigCardView } from '@kong-ui-public/entities-gateway-services'
import { RouteConfigCardView } from '@kong-ui-public/entities-routes'
import { CertificateConfigCardView, CACertificateConfigCardView } from '@kong-ui-public/entities-certificates'
import { KeyConfigCardView } from '@kong-ui-public/entities-keys'
import { KeySetConfigCardView } from '@kong-ui-public/entities-key-sets'
import { PluginConfigCardView } from '@kong-ui-public/entities-plugins'
import { UpstreamsConfigCardView } from '@kong-ui-public/entities-upstreams-targets'
import { RedisConfigurationConfigCardView } from '@kong-ui-public/entities-redis-configurations'

const views: Array<[string, Component, Record<string, any>]> = [
  ['Consumer', ConsumerConfigCardView, { record: { id: 'consumer', username: 'user', custom_id: 'custom' } }],
  ['ConsumerGroup', ConsumerGroupConfigCardView, { record: { id: 'group', name: 'group-name' } }],
  ['GatewayService', GatewayServiceConfigCardView, { record: { id: 'service', name: 'service-name', tls_verify: true } }],
  ['Route', RouteConfigCardView, { record: { id: 'route', service: { id: 'service' } } }],
  ['Certificate', CertificateConfigCardView, { record: { id: 'certificate', key: 'private' } }],
  ['CACertificate', CACertificateConfigCardView, { record: { id: 'ca' } }],
  ['Key', KeyConfigCardView, { record: { id: 'key', jwk: '{"kty":"RSA"}', set: { id: 'set' } } }],
  ['KeySet', KeySetConfigCardView, { record: { id: 'set', name: 'set-name' } }],
  ['Plugin', PluginConfigCardView, { record: { id: 'plugin', name: 'key-auth', config: { key_names: ['apikey'] } }, schema: { fields: [{ config: { type: 'record', fields: [{ key_names: { type: 'array', elements: { type: 'string' } } }] } }] } }],
  ['Upstreams', UpstreamsConfigCardView, { record: { id: 'upstream', name: 'upstream-name' } }],
  ['RedisConfiguration', RedisConfigurationConfigCardView, { record: { id: 'partial', name: 'cache', type: 'redis-ce', config: { host: 'localhost', password: 'private' } } }],
]

describe('business View public exports', () => {
  beforeEach(() => cy.intercept({ resourceType: /xhr|fetch/ }, req => {
    throw new Error(`Unexpected View request ${req.url}`)
  }))
  for (const [name, view, props] of views) {
    it(`${name} renders one real card with field slots and local code formats`, () => {
      cy.mount(view, { props, slots: { id: ({ record, rowValue }: any) => h('span', `slot:${record.id}:${rowValue}`) } })
      cy.get('.kong-ui-entity-base-config-card').should('have.length', 1)
      cy.getTestId('id-property-value').should('contain.text', `slot:${props.record.id}:${props.record.id}`)
      cy.getTestId('select-config-format').click()
      cy.getTestId('select-item-json').click()
      cy.get('#json-codeblock').should('contain.text', props.record.id)
    })
  }

  it('updates Route association input without reading its service', () => {
    cy.mount(RouteConfigCardView, { props: { record: { id: 'route', service: { id: 'service' } } } }).then(({ wrapper }) => {
      cy.getTestId('service-property-value').should('contain.text', 'service')
      cy.then(() => wrapper.setProps({ service: { id: 'service', loading: true } }))
      cy.getTestId('service-name-loader').should('exist')
      cy.then(() => wrapper.setProps({ service: { id: 'service', name: 'resolved-service' } }))
      cy.getTestId('service-property-value').should('contain.text', 'resolved-service')
      cy.then(() => wrapper.setProps({ service: { id: 'other', name: 'stale-service' } }))
      cy.getTestId('service-property-value').should('not.contain.text', 'stale-service')
    })
  })

  it('updates Key association and JWK representation without retaining previous parsed fields', () => {
    cy.mount(KeyConfigCardView, { props: { record: { id: 'key', set: { id: 'set' }, jwk: '{"kty":"RSA","old":"field"}' } } }).then(({ wrapper }) => {
      cy.getTestId('jwk.old-plain-text').should('contain.text', 'field')
      cy.then(() => wrapper.setProps({ keySet: { id: 'set', loading: true } }))
      cy.getTestId('key-set-name-loader').should('exist')
      cy.then(() => wrapper.setProps({ keySet: { id: 'set', name: 'resolved-set' }, record: { id: 'key', set: { id: 'set' }, jwk: '{"kty":"EC"}' } }))
      cy.getTestId('set-property-value').should('contain.text', 'resolved-set')
      cy.getTestId('jwk.old-plain-text').should('not.exist')
      cy.getTestId('jwk.kty-plain-text').should('contain.text', 'EC')
      cy.then(() => wrapper.setProps({ keySet: { id: 'other', name: 'stale-set' } }))
      cy.getTestId('set-property-value').should('contain.text', 'set').and('not.contain.text', 'stale-set')
    })
  })

  it('requires Plugin schema and uses identity-checked external association names', () => {
    const record = { id: 'plugin', name: 'key-auth', service: { id: 'service' }, config: { token: 'secret-token' } }
    const schema = Object.freeze({ fields: [{ config: { type: 'record', fields: [{ token: { type: 'string', encrypted: true } }] } }] })
    cy.mount(PluginConfigCardView, { props: { record, schema, config: { showScopeName: true }, showNameAsLink: true } }).then(({ wrapper }) => {
      cy.getTestId('service-property-value').should('contain.text', 'service')
      cy.getTestId('token-property-value').should('not.contain.text', 'secret-token')
      cy.then(() => wrapper.setProps({ referenceEntities: { service: { id: 'service', name: 'resolved-name' } } }))
      cy.getTestId('service-property-value').should('contain.text', 'resolved-name')
      cy.then(() => wrapper.setProps({ referenceEntities: { service: { id: 'other', name: 'stale-name' } } }))
      cy.getTestId('service-property-value').should('not.contain.text', 'stale-name')
      cy.then(() => wrapper.setProps({ schema: {} }))
      cy.getTestId('plugin-config-card-schema-error').should('exist')
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
      config: { app: 'konnect', pluginType: 'datakit' }, schema,
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
})
