import PageInfoSection from './PageInfoSection.vue'

describe('<PageInfoSection />', () => {
  describe('as a collapsible section', () => {
    it('renders a collapsible section', () => {
      const title = 'Collapsible section'
      const description = 'This is a collapsible section.'

      cy.mount(PageInfoSection, {
        props: {
          title,
          description,
          collapsible: true,
        },
        slots: {
          default: '<div data-testid="slotted-hidden-content">Content</div>',
        },
      })

      cy.getTestId('page-info-section').should('be.visible').and('not.have.attr', 'open')
      // verify correct HTML tag
      cy.getTestId('page-info-section').should('have.prop', 'tagName').and('eq', 'DETAILS')
      cy.getTestId('page-info-section').findTestId('slotted-hidden-content').should('not.be.visible')

      // verify correct content
      cy.getTestId('page-info-section-title').should('be.visible').and('have.text', title)
      cy.getTestId('page-info-section-description').should('be.visible').and('have.text', description)

      // verify correct HTML tag
      cy.getTestId('page-info-section-header').should('have.prop', 'tagName').and('eq', 'SUMMARY')
      cy.getTestId('page-info-section-header').find('.page-info-section-chevron-icon').should('be.visible')
    })

    it('expands and collapses the section when clicking the header', () => {
      const slottedContentTestId = 'slotted-hidden-content'

      cy.mount(PageInfoSection, {
        props: {
          title: 'Collapsible section',
          collapsible: true,
        },
        slots: {
          default: `<div data-testid="${slottedContentTestId}">Content</div>`,
        },
      })

      // expand the section
      cy.getTestId('page-info-section-header').click()

      cy.getTestId('page-info-section').should('have.attr', 'open')
      cy.getTestId(slottedContentTestId).should('be.visible')

      // collapse the section
      cy.getTestId('page-info-section-header').click()

      cy.getTestId('page-info-section').should('not.have.attr', 'open')
      cy.getTestId(slottedContentTestId).should('not.be.visible')
    })
  })

  describe('as a non-collapsible section', () => {
    it('renders a non-collapsible section', () => {
      const title = 'Non-collapsible section'
      const slottedContentTestId = 'slotted-always-visible-content'

      cy.mount(PageInfoSection, {
        props: {
          title,
          collapsible: false,
        },
        slots: {
          default: `<div data-testid="${slottedContentTestId}">Content</div>`,
        },
      })

      cy.getTestId('page-info-section').as('details')
      cy.getTestId('page-info-section-header').as('summary')

      // verify correct HTML tag
      cy.getTestId('page-info-section').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('page-info-section').findTestId(slottedContentTestId).should('be.visible')

      cy.getTestId('page-info-section-header').should('be.visible').and('have.text', title)
      // verify correct HTML tag
      cy.getTestId('page-info-section-header').should('have.prop', 'tagName').and('eq', 'DIV')
      cy.getTestId('page-info-section-header').find('.page-info-section-chevron-icon').should('not.exist')
    })

    it('renders actions slot', () => {
      const slottedActionsTestId = 'slotted-action-button'

      cy.mount(PageInfoSection, {
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
