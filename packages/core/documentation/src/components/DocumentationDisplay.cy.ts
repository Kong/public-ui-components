import DocumentationDisplay from './DocumentationDisplay.vue'


describe('<DocumentationDisplay />', () => {

  const baseProps = {
    canEdit: () => true,
    card: false,
    hidePublishToggle: false,
    selectedDocument: {
      document: {
        id: '1',
        parent_document_id: null,
        title: 'Test Document',
        slug: 'test-document',
        metadata: {},
        status: 'unpublished',
        children: [],
        revision: undefined,
      },
      ast: {
        'ok': 'bud',
      },
      markdown: '# TEST',
      status: 'unpublished',
    },
  }

  it('renders document title when no revision', () => {
    cy.mount(DocumentationDisplay as any, {
      props: { ...baseProps },
    })

    cy.get('.document-title').should('contain', 'Test Document')
  })

  it('renders document title when revision', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        selectedDocument: {
          ...baseProps.selectedDocument,
          document: {
            ...baseProps.selectedDocument.document,
            title: '',
            revision: { id: '1', title: 'Test Document - Revision 1' },
          },
        },
      },
    })

    cy.get('.document-title').should('contain', 'Test Document - Revision 1')
  })

  it('respects hidePublishToggle', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        hidePublishToggle: true,
      },
    })

    cy.get('.document-status').should('not.exist')
  })

  it('shows publish status', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        selectedDocument: {
          ...baseProps.selectedDocument,
          document: {
            ...baseProps.selectedDocument.document,
            status: 'published',
          },
        },
      },
    })

    cy.get('.document-status').should('exist')
  })

  it('can toggle published status', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        card: false,
        hidePublishToggle: false,
        selectedDocument: {
          ...baseProps.selectedDocument,
          document: {
            ...baseProps.selectedDocument.document,
            status: 'published',
          },
        },
      },
    })

    cy.get('.document-status').should('contain', 'Published')
    cy.get('.document-publish-toggle .switch-control').click()
    cy.get('.document-status').should('contain', 'Unpublished')
  })

  it('shows discard when changes detected and publish state changes', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        selectedDocument: {
          ...baseProps.selectedDocument,
          document: {
            ...baseProps.selectedDocument.document,
            status: 'published',
          },
        },
      },
    })

    cy.get('.document-status').should('contain', 'Published')
    cy.getTestId('edit').click({ timeout: 1000 })
    cy.getTestId('markdown-editor').get('textarea').type('New content')
    cy.getTestId('markdown-editor').get('textarea')
      .invoke('val')
      .should('contain', 'New content')
    cy.get('.document-publish-toggle .switch-control').click()
    cy.get('.document-status').should('not.contain', 'Unpublished')
    cy.getTestId('discard-changes-prompt').should('exist')
  })

  it('does not show created date when createdAt is empty', () => {
    cy.mount(DocumentationDisplay as any, {
      props: { ...baseProps },
    })

    cy.get('.document-create').should('not.exist')
  })

  it('document title shows the .md extension', () => {
    cy.mount(DocumentationDisplay as any, {
      props: { ...baseProps },
    })

    cy.get('.document-title .document-title-extension').should('contain', 'md')
    cy.get('.document-title').should('contain', 'Test Document')
  })

  it('typing in the editor updates the textarea value', () => {
    cy.mount(DocumentationDisplay as any, {
      props: {
        ...baseProps,
        selectedDocument: {
          ...baseProps.selectedDocument,
          document: {
            ...baseProps.selectedDocument.document,
            status: 'published',
          },
        },
      },
    })

    cy.getTestId('edit').click({ timeout: 1000 })
    cy.getTestId('markdown-editor').get('textarea').clear()
    cy.getTestId('markdown-editor').get('textarea').type('Hello World')
    cy.getTestId('markdown-editor').get('textarea')
      .invoke('val')
      .should('contain', 'Hello World')
  })
})
