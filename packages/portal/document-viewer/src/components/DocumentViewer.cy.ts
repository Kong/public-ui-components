// Cypress component test spec file

import { defaultDocument } from '../../fixtures/markdown-data'
import DocumentViewer from './DocumentViewer.vue'

describe('<DocumentViewer />', () => {
  it('renders correctly with props', () => {
    cy.mount(DocumentViewer, {
      props: {
        document: defaultDocument as any,
      },
    })

    cy.getTestId('document-viewer').should('be.visible')
  })

  it('renders fixture markdown content correctly', () => {
    cy.mount(DocumentViewer, {
      props: {
        document: defaultDocument as any,
      },
    })

    cy.getTestId('document-viewer').should('have.class', 'document-viewer')
    cy.get('.document-viewer').find('h1').should('be.visible')
    cy.get('.document-viewer').find('h2').should('be.visible')
    cy.get('.document-viewer').find('h3').should('be.visible')
    cy.get('.document-viewer').find('h4').should('be.visible')
    cy.get('.document-viewer').find('h5').should('be.visible')
    cy.get('.document-viewer').find('h6').should('be.visible')
    cy.get('.document-viewer').find('p').should('be.visible')
    cy.get('.document-viewer').find('blockquote').should('be.visible')
    cy.get('.document-viewer').find('ul').should('be.visible')
    cy.get('.document-viewer').find('pre').should('be.visible')
    cy.get('.document-viewer').find('table').should('be.visible')
    cy.get('.document-viewer').find('figure').should('be.visible')
  })

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(DocumentViewer)

    cy.getTestId('document-viewer-error').should('be.visible')
  })
})
