import MarkdownTileRenderer from './MarkdownTileRenderer.vue'

describe('<MarkdownTileRenderer />', () => {
  it('renders markdown content as HTML', () => {
    cy.mount(MarkdownTileRenderer, {
      props: {
        content: '## Hello World\n\nThis is **bold** text.',
      },
    })

    cy.get('.markdown-tile-renderer').should('exist')
    cy.get('.markdown-tile-renderer h2').should('contain.text', 'Hello World')
    cy.get('.markdown-tile-renderer strong').should('contain.text', 'bold')
  })

  it('renders paragraph text', () => {
    cy.mount(MarkdownTileRenderer, {
      props: {
        content: 'Plain paragraph text.',
      },
    })

    cy.get('.markdown-tile-renderer').should('contain.text', 'Plain paragraph text.')
  })

  it('does not execute injected script tags', () => {
    cy.mount(MarkdownTileRenderer, {
      props: {
        content: '<script>window.__xss = true<\/script>\n\nSafe content.',
      },
    })

    cy.get('.markdown-tile-renderer script').should('not.exist')
    cy.window().its('__xss').should('equal', undefined)
  })

  it('does not render inline event handlers', () => {
    cy.mount(MarkdownTileRenderer, {
      props: {
        content: '<img src="x" onerror="window.__xss2 = true">',
      },
    })

    cy.get('.markdown-tile-renderer [onerror]').should('not.exist')
    cy.window().its('__xss2').should('equal', undefined)
  })
})
