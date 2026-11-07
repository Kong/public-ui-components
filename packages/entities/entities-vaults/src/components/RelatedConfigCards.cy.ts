import { RouteConfigCard } from '../../../entities-routes/src'
import { KeyConfigCard } from '../../../entities-keys/src'

const config = { app: 'konnect' as const, apiBaseUrl: '/related', controlPlaneId: 'cp', entityId: 'entity' }

describe('legacy association-reading containers', () => {
  it('retains Route service resolution, raw events and one rendered card', () => {
    const record = { id: 'entity', name: 'route', service: { id: 'service' } }
    cy.intercept('GET', '**/core-entities/routes/entity', record).as('route')
    cy.intercept('GET', '**/core-entities/services/service', { id: 'service', name: 'service-name' }).as('service')
    cy.mount(RouteConfigCard, { props: { config, 'onFetch:success': cy.spy().as('success') } })
    cy.wait('@route')
    cy.wait('@service')
    cy.getTestId('service-property-value').should('contain.text', 'service-name')
    cy.get('@success').should('have.been.calledOnceWith', record)
    cy.get('@route.all').should('have.length', 1)
    cy.get('@service.all').should('have.length', 1)
    cy.get('.kong-ui-entity-base-config-card').should('have.length', 1)
  })

  it('retains association failure events and the previous Route empty display', () => {
    cy.intercept('GET', '**/core-entities/routes/entity', { id: 'entity', service: { id: 'service' } })
    cy.intercept('GET', '**/core-entities/services/service', { statusCode: 500, body: {} }).as('service')
    cy.mount(RouteConfigCard, { props: { config, 'onFetch:error': cy.spy().as('error') } })
    cy.wait('@service')
    cy.get('@error').should('have.been.calledOnce')
    cy.getTestId('service-property-value').should('have.text', '-')
  })

  it('retains Key Set reads and local key expansion', () => {
    cy.intercept('GET', '**/core-entities/keys/entity', { id: 'entity', set: { id: 'set' }, jwk: '{"kty":"RSA"}' }).as('key')
    cy.intercept('GET', '**/core-entities/key-sets/set', { id: 'set', name: 'set-name' }).as('set')
    cy.mount(KeyConfigCard, { props: { config } })
    cy.wait('@key')
    cy.wait('@set')
    cy.getTestId('set-property-value').should('contain.text', 'set-name')
    cy.getTestId('jwk.kty-plain-text').should('contain.text', 'RSA')
    cy.get('@key.all').should('have.length', 1)
    cy.get('@set.all').should('have.length', 1)
  })
})
