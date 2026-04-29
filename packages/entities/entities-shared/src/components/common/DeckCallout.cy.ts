import DeckCallout from './DeckCallout.vue'
import composables from '../../composables'

describe('<DeckCallout />', () => {
  const { i18n: { t } } = composables.useI18n()

  beforeEach(() => {
    cy.mount(DeckCallout)
  })

  it('renders the callout copy with the CTA', () => {
    cy.get('.deck-callout').should('be.visible')
    cy.get('.deck-callout .cta').should('contain.text', t('deckCallout.cta'))
  })

  it('emits "click-cta" when the CTA is clicked', () => {
    cy.get('.deck-callout .cta').click()
    cy.then(() => Cypress.vueWrapper.emitted('click-cta')).should('have.length', 1)
  })

  it('emits "dismiss" when the alert is dismissed', () => {
    cy.get('.deck-callout .alert-dismiss-icon').click()
    cy.then(() => Cypress.vueWrapper.emitted('dismiss')).should('have.length', 1)
  })
})
