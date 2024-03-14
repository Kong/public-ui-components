// Cypress component test spec file

import AppAboutSection from './AppAboutSection.vue'

describe('<AppAboutSection />', () => {
  it('should correctly renders loading state', () => {
    const title = 'Cats are Cool'
    const description = 'cool cat description'

    cy.mount(AppAboutSection, {
      props: {
        title,
        description,
        isLoading: true,
      },
    })

    cy.get('.kong-ui-app-about-section').should('exist')
    cy.getTestId('about-section-loading-skeleton').should('be.visible')
  })

  it('should correctly render content when using props', () => {
    const title = 'Cats are Cool'
    const titleTag = 'h4'
    const description = 'cool cat description'
    const created = '2023-02-17'
    const createdLabel = 'Joined'
    const modified = '2023-02-17 15:23:34'
    const modifiedLabel = 'Edited'

    cy.mount(AppAboutSection, {
      props: {
        title,
        titleTag,
        description,
        created,
        createdLabel,
        modified,
        modifiedLabel,
      },
    })

    cy.get('.kong-ui-app-about-section').should('exist')
    cy.get(`${titleTag}.about-section-title`).should('be.visible')
    cy.getTestId('about-section-title').should('contain.text', title)
    cy.getTestId('about-section-description').should('be.visible')
    cy.getTestId('about-section-description').should('contain.text', description)
    cy.getTestId('about-section-timestamps-created').should('be.visible')
    cy.getTestId('about-section-timestamps-created').should('contain.text', created)
    cy.getTestId('about-section-timestamps-created').should('contain.text', createdLabel)
    cy.getTestId('about-section-timestamps-modified').should('be.visible')
    cy.getTestId('about-section-timestamps-modified').should('contain.text', modified)
    cy.getTestId('about-section-timestamps-modified').should('contain.text', modifiedLabel)
  })

  it('should not render modified when it equals created', () => {
    const title = 'Cats are Cool'
    const description = 'cool cat description'
    const created = '2023-02-17'

    cy.mount(AppAboutSection, {
      props: {
        title,
        description,
        created,
        modified: created,
      },
    })

    cy.get('.kong-ui-app-about-section').should('exist')
    cy.getTestId('about-section-timestamps-created').should('be.visible')
    cy.getTestId('about-section-timestamps-created').should('contain.text', created)
    cy.getTestId('about-section-timestamps-modified').should('not.exist')
  })

  it('should correctly render content when use slots', () => {
    const title = 'Cats are Cool'
    const description = 'cool cat description'
    const actionsText = 'Actions'
    const mainContent = 'A cat a day is a lot of cats'
    const dividerText = 'Cats can spend up to a third of their waking hours grooming'

    cy.mount(AppAboutSection, {
      props: {
        title,
        description,
      },
      slots: {
        actions: actionsText,
        default: mainContent,
        'divider-section': dividerText,
      },
    })

    cy.get('.kong-ui-app-about-section').should('exist')
    cy.getTestId('about-section-actions').should('be.visible')
    cy.getTestId('about-section-actions').should('contain.text', actionsText)
    cy.getTestId('about-section-content').should('be.visible')
    cy.getTestId('about-section-content').should('contain.text', mainContent)
    cy.getTestId('about-divider-section').should('be.visible')
    cy.getTestId('about-divider-section-separator').should('be.visible')
    cy.getTestId('about-divider-section').should('contain.text', dividerText)
  })

  it('should not render empty props/slots', () => {
    cy.mount(AppAboutSection, {})

    cy.get('.kong-ui-app-about-section').should('exist')
    cy.getTestId('about-section-title').should('not.exist')
    cy.getTestId('about-section-description').should('not.exist')
    cy.getTestId('about-section-timestamps-created').should('not.exist')
    cy.getTestId('about-section-timestamps-modified').should('not.exist')
    cy.getTestId('about-section-actions').should('not.exist')
    cy.getTestId('about-section-content').should('not.exist')
    cy.getTestId('about-divider-section').should('not.exist')
    cy.getTestId('about-divider-section-separator').should('not.exist')
  })
})
