// Cypress component test spec file
import GithubStar from './GithubStar.vue'

describe('<GithubStar />', () => {
  it('renders correctly with props', () => {
    cy.mount(GithubStar, {
      props: {
        url: 'http://github.com/kong/kong',
      },
    })

    cy.get('.kong-ui-public-misc-widgets-github-star').should('be.visible')
  })

  it('renders content correctly', () => {
    cy.mount(GithubStar, {
      props: {
        url: 'http://github.com/kong/kong',
      },
    })

    cy.getTestId('github-star').should('have.class', 'kong-ui-public-misc-widgets-github-star')
    cy.getTestId('github-star').find('a').should('be.visible')
    cy.getTestId('github-star').find('.github-button').should('be.visible')
  })

  it('renders default tooltip text on mouseenter', () => {
    cy.mount(GithubStar, {
      props: {
        url: 'http://github.com/kong/kong',
      },
    })
    cy.get('.github-button').trigger('mouseenter')
    cy.get('.k-popover').should('be.visible')
    cy.get('.k-popover').contains('Star this repository on Github')
  })
})
