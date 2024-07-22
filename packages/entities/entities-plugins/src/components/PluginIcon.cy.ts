import PluginIcon from './PluginIcon.vue'

describe('<PluginIcon />', () => {

  it('should render the correct plugin icon', () => {
    cy.mount(PluginIcon, {
      props: {
        name: 'basic-auth',
      },
    })

    cy.get('img')
      .should('be.visible')
      .and($img => {
        expect($img[0].src).to.match(/basic-auth/)
        expect($img[0].naturalWidth).to.be.greaterThan(0)
      })
  })

  it('should render the default plugin icon if plugin name not found', () => {
    cy.mount(PluginIcon, {
      props: {
        name: 'i-love-cat',
      },
    })

    cy.get('img')
      .should('be.visible')
      .and($img => {
        expect($img[0].src).to.match(/missing/)
        expect($img[0].naturalWidth).to.be.greaterThan(0)
      })
  })

  it('should have default size', () => {
    cy.mount(PluginIcon, {
      props: {
        name: 'basic-auth',
      },
    })

    cy.get('img').should('have.prop', 'width', 32)
  })

  it('should have custom size', () => {
    cy.mount(PluginIcon, {
      props: {
        name: 'basic-auth',
        size: 64,
      },
    })

    cy.get('img').should('have.prop', 'width', 64)
  })
})
