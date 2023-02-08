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

  it('renders error state when missing required props', () => {
    // @ts-ignore - because we are purposely testing the handling of invalid prop values
    cy.mount(DocumentViewer)

    cy.getTestId('document-viewer-error').should('be.visible')
  })
})
