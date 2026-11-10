import { testConfigCardView } from '../../../entities-shared/fixtures/config-card'
import { RouteConfigCard, RouteConfigCardView } from '../index'

describe('<RouteConfigCardView />', () => {
  testConfigCardView('RouteConfigCardView', RouteConfigCardView, { record: { id: 'route', service: { id: 'service' } } })

  it('updates the Service display from the service prop without reading it', () => {
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
})

describe('<RouteConfigCard />', () => {
  const config = { app: 'konnect' as const, apiBaseUrl: '/related', controlPlaneId: 'cp', entityId: 'entity' }

  it('resolves the Service name, emits the raw record and renders one card', () => {
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

  it('emits Service lookup failures and keeps the empty display', () => {
    cy.intercept('GET', '**/core-entities/routes/entity', { id: 'entity', service: { id: 'service' } })
    cy.intercept('GET', '**/core-entities/services/service', { statusCode: 500, body: {} }).as('service')
    cy.mount(RouteConfigCard, { props: { config, 'onFetch:error': cy.spy().as('error') } })
    cy.wait('@service')
    cy.get('@error').should('have.been.calledOnce')
    cy.getTestId('service-property-value').should('have.text', '-')
  })

  it('keeps host attributes, the root class and the request URL after loading', () => {
    cy.intercept('GET', '**/core-entities/routes/entity', { delay: 300, body: { id: 'entity', name: 'route' } }).as('route')
    cy.mount(RouteConfigCard, { props: { config }, attrs: { class: 'host-class', 'data-testid': 'host-card' } })
    cy.get('.host-class.kong-ui-entities-route-entity-config-card [data-testid="config-card-loader"]').should('exist')
    cy.wait('@route')
    cy.getTestId('host-card').should('have.class', 'kong-ui-entities-route-entity-config-card')
      .find('.kong-ui-entity-base-config-card').should('have.length', 1)
    cy.getTestId('select-config-format').click()
    cy.getTestId('select-item-json').click()
    cy.get('#json-endpoint-codeblock').should('contain.text', '/related/v2/control-planes/cp/core-entities/routes/entity')
  })
})
