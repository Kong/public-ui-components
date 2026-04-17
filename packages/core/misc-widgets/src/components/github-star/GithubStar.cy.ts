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
    // Intercept the GitHub buttons script to prevent it from replacing
    // the <a> element with an <iframe>, which would detach the element from DOM
    cy.intercept('https://buttons.github.io/buttons.js', { body: '' })
    cy.mount(GithubStar, {
      props: {
        url: 'http://github.com/kong/kong',
      },
    })
    cy.get('.github-button').trigger('mouseenter')
    cy.get('.popover').should('be.visible')
    cy.get('.popover').contains('Star this repository on Github')
  })
})
