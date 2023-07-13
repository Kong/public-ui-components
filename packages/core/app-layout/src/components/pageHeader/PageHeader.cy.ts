// Cypress component test spec file

import PageHeader from './PageHeader.vue'

describe('<PageHeader />', () => {
  it('should correctly render content when using props', () => {
    const title = 'Cats are Cool'
    const breadcrumbTitle = 'Home'

    cy.mount(PageHeader, {
      props: {
        title,
        breadcrumbs: [{
          key: 'home',
          to: { name: 'home' },
          text: breadcrumbTitle,
          icon: 'kong',
        }],
      },
    })

    cy.get('.kong-ui-page-header').should('exist')
    cy.getTestId('page-breadcrumbs').should('be.visible')
    cy.get('.k-breadcrumb-text').should('contain.text', breadcrumbTitle)
    cy.getTestId('page-title-text').should('be.visible')
    cy.getTestId('page-title-text').should('contain.text', title)
  })

  it('should correctly render content when use slots', () => {
    const title = 'Cats are Cool'
    const breadcrumbText = 'breadcrumbs-are-cool'
    const iconText = 'title-icons-are-cool'
    const badgeText = 'title-badges-are-cool'
    const actionsText = 'actions-are-cool'

    cy.mount(PageHeader, {
      slots: {
        breadcrumbs: breadcrumbText,
        default: title,
        'title-icon': iconText,
        'title-badge': badgeText,
        actions: actionsText,
      },
    })

    cy.get('.kong-ui-page-header').should('exist')
    cy.getTestId('page-breadcrumbs').should('be.visible')
    cy.getTestId('page-breadcrumbs').should('contain.text', breadcrumbText)
    cy.getTestId('page-title-icon').should('be.visible')
    cy.getTestId('page-title-icon').should('contain.text', iconText)
    cy.getTestId('page-title-text').should('be.visible')
    cy.getTestId('page-title-text').should('contain.text', title)
    cy.getTestId('page-title-badge').should('be.visible')
    cy.getTestId('page-title-badge').should('contain.text', badgeText)
    cy.getTestId('page-actions').should('be.visible')
    cy.getTestId('page-actions').should('contain.text', actionsText)
  })

  it('should not render empty slots', () => {
    const title = 'Cats are Cool'

    cy.mount(PageHeader, {
      props: {
        title,
      },
    })

    cy.get('.kong-ui-page-header').should('exist')
    cy.getTestId('page-breadcrumbs').should('not.exist')
    cy.getTestId('page-title-icon').should('not.exist')
    cy.getTestId('page-title-badge').should('not.exist')
    cy.getTestId('page-actions').should('not.exist')
  })
})
