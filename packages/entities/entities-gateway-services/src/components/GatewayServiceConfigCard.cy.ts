import GatewayServiceConfigCard from './GatewayServiceConfigCard.vue'

describe('<GatewayServiceConfigCard />', () => {
  it('keeps the format menu open when the service finishes loading', () => {
    let finishLoading: () => void
    const responseReady = new Cypress.Promise<void>(resolve => {
      finishLoading = resolve
    })
    cy.intercept('GET', '/v2/control-planes/plane/core-entities/services/service', req => {
      return responseReady.then(() => req.reply({ id: 'service', name: 'loaded-service' }))
    }).as('service')

    cy.mount(GatewayServiceConfigCard, {
      props: {
        config: { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'plane', entityId: 'service' },
      },
    })
    cy.getTestId('config-card-loader').should('be.visible')
    cy.getTestId('select-config-format').click()
    cy.getTestId('select-item-yaml').should('be.visible')

    cy.then(() => finishLoading())
    cy.wait('@service')
    cy.getTestId('name-property-value').should('contain.text', 'loaded-service')
    cy.getTestId('select-item-yaml').should('be.visible').click()
    cy.get('#yaml-codeblock').should('contain.text', 'loaded-service')
  })
})
