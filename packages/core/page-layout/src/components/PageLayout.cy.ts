import PageLayout from './PageLayout.vue'

describe('<PageLayout />', () => {
  const title = 'Test Page Title'

  it('renders breadcrumbs, title and tabs when breadcrumbs and tabs are passed', () => {
    const breadcrumbs = [
      { key: 'home', text: 'Home', to: '/' },
      { key: 'current', text: 'Current Page' },
    ]
    const tabs = [
      { key: 'overview', label: 'Overview', to: '/overview' },
      { key: 'settings', label: 'Settings', to: '/settings' },
    ]

    cy.mount(PageLayout, {
      props: {
        title,
        breadcrumbs,
        tabs,
      },
    })

    cy.getTestId('page-layout-breadcrumbs').should('be.visible')
    cy.getTestId('page-layout-title').should('be.visible').and('contain.text', title)
    cy.getTestId('page-layout-tabs').should('be.visible')
  })

  it('renders only the title when neither breadcrumbs nor tabs are passed', () => {
    cy.mount(PageLayout, {
      props: {
        title,
      },
    })

    cy.getTestId('page-layout-breadcrumbs').should('not.exist')
    cy.getTestId('page-layout-title').should('be.visible').and('contain.text', title)
    cy.getTestId('page-layout-tabs').should('not.exist')
  })
})
