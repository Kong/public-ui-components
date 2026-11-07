import { RedisConfigurationConfigCardView, RedisConfigurationConfigCard } from '../index'

const record = Object.freeze({
  id: 'addon', name: 'managed-cache', state: 'ready', created_at: '2025-01-01T00:00:00Z',
  owner: { kind: 'control-plane', control_plane_id: 'cp', control_plane_geo: 'us' },
  config: Object.freeze({ kind: 'managed-cache.v0', capacity_config: Object.freeze({ kind: 'tiered', tier: '3' }), state_metadata: { cache_config_id: 'partial' } }),
  future_api_field: 'preserve-in-code-only',
})
const select = (format: string) => {
  cy.getTestId('select-config-format').click()
  cy.getTestId(`select-item-${format}`).click()
}

describe('managed Redis record-driven presentation', () => {
  it('preserves the raw code payload, local Terraform transform and reactive records without reads', () => {
    cy.intercept({ resourceType: /xhr|fetch/ }, req => {
      throw new Error(`Unexpected View request ${req.url}`)
    })
    cy.mount(RedisConfigurationConfigCardView, { props: { record, config: { app: 'konnect' }, hideTitle: false } }).then(({ wrapper }) => {
      cy.getTestId('future_api_field-property-value').should('not.exist')
      select('json')
      cy.get('#json-codeblock .highlighted-code-block code').invoke('text').then(text => expect(JSON.parse(text)).to.deep.equal(record))
      select('terraform')
      cy.get('#terraform-codeblock').should('contain.text', 'konnect_cloud_gateway_addon').and('contain.text', 'tiered')
      cy.then(() => wrapper.setProps({ record: { ...record, name: 'refreshed-cache' } }))
      cy.get('#terraform-codeblock').should('contain.text', 'refreshed-cache')
      cy.then(() => expect(record.name).to.equal('managed-cache'))
    })
  })

  it('keeps existing managed discovery and events while rendering one shared View', () => {
    cy.intercept('GET', '/managed/v2/cloud-gateways/add-ons/addon*', record).as('addon')
    cy.mount(RedisConfigurationConfigCard, { props: {
      config: { app: 'konnect', controlPlaneId: 'cp', apiBaseUrl: '/managed', entityId: 'addon', isCloudGateway: true },
      'onFetch:managed-add-on-success': cy.spy().as('success'),
    } })
    cy.getTestId('managed-konnect-redis-detail').should('exist')
    cy.get('.kong-ui-entity-base-config-card').should('have.length', 1)
    cy.get('@success').should('have.been.calledOnceWith', record)
    select('json')
    cy.get('#json-codeblock').should('contain.text', 'preserve-in-code-only')
    cy.get('#json-endpoint-codeblock').should('contain.text', '/managed/v2/cloud-gateways/add-ons/addon')
  })

  it('derives partial display from the record and keeps legacy nested YAML suppression in the reader', () => {
    const partial = { id: 'partial', name: 'cache', type: 'redis-ce', config: { host: 'localhost' } }
    cy.mount(RedisConfigurationConfigCardView, { props: { record: partial } })
    select('yaml')
    cy.get('#yaml-codeblock').should('contain.text', 'localhost')
    cy.intercept('GET', '**/partials/partial', partial).as('partial')
    cy.mount(RedisConfigurationConfigCard, { props: {
      config: { app: 'konnect', controlPlaneId: 'cp', apiBaseUrl: '/partial', entityId: 'partial' },
      disableKonnectManagedDetail: true,
    } })
    cy.wait('@partial')
    cy.getTestId('select-config-format').click()
    cy.getTestId('select-item-yaml').should('not.exist')
    cy.getTestId('select-item-json').click()
    cy.get('#json-codeblock').should('contain.text', 'localhost')
  })
})
