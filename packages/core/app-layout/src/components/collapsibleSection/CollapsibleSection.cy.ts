import CollapsibleSection from './CollapsibleSection.vue'

describe('<CollapsibleSection />', () => {
  describe('as a collapsible section', () => {
    it('renders a collapsible section', () => {
      const title = 'Collapsible section'
      const description = 'This is a collapsible section.'

      cy.mount(CollapsibleSection, {
        props: {
          title,
          description,
          collapsible: true,
        },
        slots: {
          default: '<div data-testid="slotted-hidden-content">Content</div>',
        },
      })

      cy.getTestId('collapsible-section').should('be.visible').and('not.have.attr', 'open')
      // verify correct HTML tag
      cy.getTestId('collapsible-section').should('have.prop', 'tagName').and('eq', 'DETAILS')
      cy.getTestId('collapsible-section').findTestId('slotted-hidden-content').should('not.be.visible')

      // verify correct content
      cy.getTestId('collapsible-section-title').should('be.visible').and('have.text', title)
      cy.getTestId('collapsible-section-description').should('be.visible').and('have.text', description)

      // verify correct HTML tag
      cy.getTestId('collapsible-section-header').should('have.prop', 'tagName').and('eq', 'SUMMARY')
      cy.getTestId('collapsible-section-header').find('.collapsible-section-chevron-icon').should('be.visible')
    })

    it('expands and collapses the section when clicking the header', () => {
      const slottedContentTestId = 'slotted-hidden-content'

      cy.mount(CollapsibleSection, {
        props: {
          title: 'Collapsible section',
          collapsible: true,
        },
        slots: {
          default: `<div data-testid="${slottedContentTestId}">Content</div>`,
        },
      })

      // expand the section
      cy.getTestId('collapsible-section-header').click()

      cy.getTestId('collapsible-section').should('have.attr', 'open')
      cy.getTestId(slottedContentTestId).should('be.visible')

      // collapse the section
      cy.getTestId('collapsible-section-header').click()

      cy.getTestId('collapsible-section').should('not.have.attr', 'open')
      cy.getTestId(slottedContentTestId).should('not.be.visible')
    })
  })

  describe('as a non-collapsible section', () => {
    it('renders a non-collapsible section', () => {
      const title = 'Non-collapsible section'
      const slottedContentTestId = 'slotted-always-visible-content'

      cy.mount(CollapsibleSection, {
        props: {
          title,
          collapsible: false,
        },
        slots: {
          default: `<div data-testid="${slottedContentTestId}">Content</div>`,
        },
      })

      cy.getTestId('collapsible-section').as('details')
      cy.getTestId('collapsible-section-header').as('summary')

      // verify correct HTML tag
      cy.getTestId('collapsible-section').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('collapsible-section').findTestId(slottedContentTestId).should('be.visible')

      cy.getTestId('collapsible-section-header').should('be.visible').and('have.text', title)
      // verify correct HTML tag
      cy.getTestId('collapsible-section-header').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('collapsible-section-header').find('.collapsible-section-chevron-icon').should('not.exist')
    })

    it('renders actions slot', () => {
      const slottedActionsTestId = 'slotted-action-button'

      cy.mount(CollapsibleSection, {
        props: {
          title: 'Non-collapsible section',
          collapsible: false,
        },
        slots: {
          actions: `<button data-testid="${slottedActionsTestId}">Actions</button>`,
        },
      })

      cy.getTestId(slottedActionsTestId).should('be.visible')
    })
  })
})
