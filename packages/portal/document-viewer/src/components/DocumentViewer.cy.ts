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
    cy.getTestId('default-styles').should('exist')
  })
})
