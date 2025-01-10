import CollapsibleSection from './CollapsibleSection.vue'

describe('<CollapsibleSection />', () => {
  describe('as a collapsible section', () => {
    it('renders a collapsible section', () => {
      cy.mount(CollapsibleSection, {
        props: {
          title: 'Collapsible section',
          desciption: 'This is a collapsible section.',
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
      cy.getTestId('collapsible-section-title').should('be.visible').and('have.text', 'Collapsible Section')
      cy.getTestId('collapsible-section-description').should('be.visible').and('have.text', 'This is a collapsible section.')

      // verify correct HTML tag
      cy.getTestId('collapsible-section-header').should('have.prop', 'tagName').and('eq', 'SUMMARY')
      cy.getTestId('collapsible-section-header').find('.collapsible-section-chevron-icon').should('be.visible')
    })

    it('expands and collapses the section when clicking the header', () => {
      cy.mount(CollapsibleSection, {
        props: {
          title: 'Collapsible section',
          collapsible: true,
        },
        slots: {
          default: '<div data-testid="slotted-hidden-content">Content</div>',
        },
      })

      // expand the section
      cy.getTestId('collapsible-section-header').click()

      cy.getTestId('collapsible-section').should('have.attr', 'open')
      cy.getTestId('hidden-content').should('be.visible')

      // collapse the section
      cy.getTestId('collapsible-section-header').click()

      cy.getTestId('collapsible-section').should('not.have.attr', 'open')
      cy.getTestId('slotted-hidden-content').should('not.be.visible')
    })
  })

  describe('as a non-collapsible section', () => {
    it('renders a non-collapsible section', () => {
      cy.mount(CollapsibleSection, {
        props: {
          title: 'Non-collapsible section',
          collapsible: false,
        },
        slots: {
          default: '<div data-testid="slotted-always-visible-content">Content</div>',
        },
      })

      cy.getTestId('collapsible-section').as('details')
      cy.getTestId('collapsible-section-header').as('summary')

      // verify correct HTML tag
      cy.getTestId('collapsible-section').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('collapsible-section').findTestId('slotted-always-visible-content').should('be.visible')

      cy.getTestId('collapsible-section-header').should('be.visible').and('have.text', 'Non-Collapsible Section')
      // verify correct HTML tag
      cy.getTestId('collapsible-section-header').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('collapsible-section-header').find('.collapsible-section-chevron-icon').should('not.exist')
    })

    it('renders actions slot', () => {
      cy.mount(CollapsibleSection, {
        props: {
          title: 'Non-collapsible section',
          collapsible: false,
        },
        slots: {
          actions: '<button data-testid="slotted-action-button">Actions</button>',
        },
      })

      cy.getTestId('slotted-action-button').should('be.visible').and('have.text', 'Actions')
    })
  })
})
