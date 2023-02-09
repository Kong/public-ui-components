// Cypress component test spec file
import GithubStar from './GithubStar.vue'

describe('<GithubStar />', () => {
  it('TODO: This is an example test', () => {
    cy.mount(GithubStar)

    cy.get('.kong-ui-public-misc-widgets-github-star').should('be.visible')
  })
})
