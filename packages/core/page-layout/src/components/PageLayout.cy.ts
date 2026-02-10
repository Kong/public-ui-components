import PageLayout from './PageLayout.vue'

describe('<PageLayout />', () => {
  const title = 'Test Page Title'

  it('renders breadcrumbs, title and tabs when breadcrumbs and tabs are passed', () => {
    const breadcrumbs = [
      { key: 'home', text: 'Home', to: '/' },
      { key: 'current', text: 'Current Page' },
    ]
    const tabs = {
      overview: { name: 'Overview', to: '/overview' },
      settings: { name: 'Settings', to: '/settings' },
    }

    cy.mount(PageLayout, {
      props: {
        konnectLayoutNext: true,
        title,
        breadcrumbs,
        tabs,
      },
    })

    cy.getTestId('kong-ui-public-page-layout-breadcrumbs').should('be.visible')
    cy.get('.header-title').should('be.visible').and('contain.text', title)
    cy.getTestId('kong-ui-public-tabs-navbar').should('be.visible')
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    cy.mount(PageLayout, {
      props: {
        konnectLayoutNext: true,
        title,
      },
    })

    cy.getTestId('kong-ui-public-page-layout-breadcrumbs').should('not.exist')
    cy.get('.header-title').should('be.visible').and('contain.text', title)
    cy.getTestId('kong-ui-public-tabs-navbar').should('not.exist')
  })
})
