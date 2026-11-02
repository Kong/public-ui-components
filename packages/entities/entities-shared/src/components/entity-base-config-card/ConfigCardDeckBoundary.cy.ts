import { h } from 'vue'
import { EntityConfigCardView, EntityBaseConfigCard, SupportedEntityType, DECK_COMMAND_EDITOR_KEY } from '../../index'

const global = { provide: { [DECK_COMMAND_EDITOR_KEY]: { render: () => h('textarea') } } }
const customize = () => {
  cy.getTestId('select-config-format').click()
  cy.getTestId('select-item-deck').click()
  cy.getTestId('config-deck-customize-button').click()
}

describe('local View export boundary', () => {
  for (const app of ['konnect', 'kongManager'] as const) {
    it(`preserves reader-owned decK callout preferences for ${app}`, () => {
      const key = `legacy-callout-${app}`
      localStorage.setItem(key, 'dismissed')
      const config = {
        app, apiBaseUrl: '/callout', entityId: 'consumer', controlPlaneId: 'cp', workspace: 'default',
        enableDeckConfig: app === 'konnect' ? { calloutPreferenceKey: key } : undefined,
        deckCalloutPreferenceKey: app === 'kongManager' ? key : undefined,
      }
      cy.intercept('GET', '/callout/consumers/consumer', { id: 'consumer', username: 'consumer' })
      cy.mount(EntityBaseConfigCard, { props: {
        config, fetchUrl: '/consumers/{id}', entityType: SupportedEntityType.Consumer,
      } }).then(({ wrapper }) => {
        cy.getTestId('select-config-format').click()
        cy.getTestId('select-item-yaml').click()
        cy.get('#yaml-codeblock').should('exist')
        cy.get('.deck-callout').should('not.exist')
        cy.then(() => wrapper.setProps({ config: {
          ...config,
          enableDeckConfig: app === 'konnect' ? { calloutPreferenceKey: `${key}-visible` } : undefined,
          deckCalloutPreferenceKey: app === 'kongManager' ? `${key}-visible` : undefined,
        } }))
        cy.get('.deck-callout').should('exist')
      })
    })
  }

  it('uses the installed editor with a boolean decK opt-in', () => {
    cy.mount(EntityConfigCardView, { global, props: {
      record: { id: 'consumer', username: 'consumer' }, entityType: SupportedEntityType.Consumer,
      config: { app: 'konnect', enableDeckConfig: true },
    } })
    customize()
    cy.get('textarea').should('exist')
    cy.getTestId('generate-konnect-pat-button').should('not.exist')
  })

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
