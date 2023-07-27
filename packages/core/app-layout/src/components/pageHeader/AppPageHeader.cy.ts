// Cypress component test spec file

import AppPageHeader from './AppPageHeader.vue'

describe('<AppPageHeader />', () => {
  it('should correctly render content when using props', () => {
    const title = 'Cats are Cool'
    const breadcrumbTitle = 'Home'

    cy.mount(AppPageHeader, {
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

    cy.get('.kong-ui-app-page-header').should('exist')
    cy.getTestId('page-header-breadcrumbs').should('be.visible')
    cy.get('.k-breadcrumb-text').should('contain.text', breadcrumbTitle)
    cy.getTestId('page-header-title').should('be.visible')
    cy.getTestId('page-header-title').should('contain.text', title)
  })

  it('should correctly render content when use slots', () => {
    const title = 'Cats are Cool'
    const breadcrumbIcon = 'home-breadcrumb-icon'
    const iconText = 'title-icons-are-cool'
    const badgeText = 'title-badges-are-cool'
    const actionsText = 'actions-are-cool'
    const belowText = 'Cats are the key to a happy life.'

    cy.mount(AppPageHeader, {
      props: {
        title,
        breadcrumbs: [{
          key: 'home',
          to: { name: 'home' },
          text: 'Home',
        }],
      },
      slots: {
        'icon-home': breadcrumbIcon,
        'title-before': iconText,
        'title-after': badgeText,
        actions: actionsText,
        below: belowText,
      },
    })

    cy.get('.kong-ui-app-page-header').should('exist')
    cy.get('.k-breadcrumb-icon-wrapper').should('be.visible')
    cy.get('.k-breadcrumb-icon-wrapper').should('contain.text', breadcrumbIcon)
    cy.getTestId('page-header-title-before').should('be.visible')
    cy.getTestId('page-header-title-before').should('contain.text', iconText)
    cy.getTestId('page-header-title-after').should('be.visible')
    cy.getTestId('page-header-title-after').should('contain.text', badgeText)
    cy.getTestId('page-header-actions').should('be.visible')
    cy.getTestId('page-header-actions').should('contain.text', actionsText)
    cy.getTestId('page-header-section-below').should('be.visible')
    cy.getTestId('page-header-section-below').should('contain.text', belowText)
  })

  it('should not render empty props/slots', () => {
    const title = 'Cats are Cool'

    cy.mount(AppPageHeader, {
      props: {
        title,
      },
    })

    cy.get('.kong-ui-app-page-header').should('exist')
    cy.getTestId('page-header-breadcrumbs').should('not.exist')
    cy.getTestId('page-header-title-before').should('not.exist')
    cy.getTestId('page-header-title-after').should('not.exist')
    cy.getTestId('page-header-actions').should('not.exist')
    cy.getTestId('page-header-section-below').should('not.exist')
  })
})
