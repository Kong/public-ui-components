import { h } from 'vue'
import { EntityConfigCardView, EntityBaseConfigCard, SupportedEntityType, DECK_COMMAND_EDITOR_KEY } from '../../index'

const global = { provide: { [DECK_COMMAND_EDITOR_KEY]: { render: () => h('textarea') } } }
const customize = () => {
  cy.getTestId('select-config-format').click()
  cy.getTestId('select-item-deck').click()
  cy.getTestId('config-deck-customize-button').click()
}

describe('local View export boundary', () => {
  it('keeps View command editing local even if JavaScript supplies a legacy token callback', () => {
    cy.intercept({ resourceType: /xhr|fetch/ }, req => {
      throw new Error(`Unexpected View request ${req.url}`)
    })
    const generateKonnectPat = cy.spy().as('generate')
    cy.mount(EntityConfigCardView, { global, props: {
      record: { id: 'consumer', username: 'consumer' }, entityType: SupportedEntityType.Consumer,
      config: { app: 'konnect', enableDeckConfig: { customization: { generateKonnectPat } as any } },
    } })
    customize()
    cy.getTestId('generate-konnect-pat-button').should('not.exist')
    cy.get('@generate').should('not.have.been.called')
  })

  it('preserves the existing explicit token-generation control in reader containers', () => {
    cy.intercept('GET', '/deck/consumers/consumer', { id: 'consumer', username: 'consumer' })
    cy.mount(EntityBaseConfigCard, { global, props: {
      config: { app: 'konnect', apiBaseUrl: '/deck', entityId: 'consumer', controlPlaneId: 'cp', enableDeckConfig: { customization: { generateKonnectPat: cy.spy() } } },
      fetchUrl: '/consumers/{id}', entityType: SupportedEntityType.Consumer,
    } })
    customize()
    cy.getTestId('generate-konnect-pat-button').should('be.visible')
  })
})
