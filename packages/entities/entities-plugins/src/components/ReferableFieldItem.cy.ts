// Cypress component test spec file
import ReferableFieldItem from './ReferableFieldItem.vue'

describe('<ReferableFieldItem />', () => {
  it('should render the field label correctly', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.my_field',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('be.visible')
    cy.get('.referable-field-link').should('contain.text', 'My Field')
  })

  it('should remove config prefix from label', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.upstream_host',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('contain.text', 'Upstream Host')
    cy.get('.referable-field-link').should('not.contain.text', 'config.')
  })

  it('should handle nested field paths', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.redis.host',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('contain.text', 'Redis.Host')
  })

  it('should show comma when isLast is false', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.field_one',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').parent().should('contain.text', ',')
  })

  it('should not show comma when isLast is true', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.field_last',
        isLast: true,
      },
    })

    cy.get('.referable-field-link').parent().should('not.contain.text', ',')
  })

  it('should show comma when isLast is undefined (default false behavior)', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.field_default',
      },
    })

    cy.get('.referable-field-link').parent().should('contain.text', ',')
  })

  it('should be clickable', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.clickable_field',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('have.css', 'cursor', 'pointer')
  })

  it('should have underline decoration', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.underlined_field',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('have.css', 'text-decoration')
      .and('match', /underline/)
  })

  it('should attempt to scroll when clicked', () => {
    // Create a target label element
    cy.document().then((doc) => {
      const label = doc.createElement('label')
      label.setAttribute('for', 'config-test_field')
      label.textContent = 'Test Field'
      label.style.marginTop = '2000px'
      doc.body.appendChild(label)
    })

    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.test_field',
        isLast: false,
      },
    })

    // Spy on window.scrollTo
    cy.window().then((win) => {
      cy.spy(win, 'scrollTo').as('scrollToSpy')
    })

    // Click the link
    cy.get('.referable-field-link').click()

    // Verify scrollTo was called
    cy.get('@scrollToSpy').should('have.been.called')
  })

  it('should handle fields without config prefix', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'enabled',
        isLast: false,
      },
    })

    cy.get('.referable-field-link').should('contain.text', 'Enabled')
  })

  it('should correctly format field IDs for querySelector', () => {
    cy.mount(ReferableFieldItem, {
      props: {
        field: 'config.some_field.nested',
        isLast: true,
      },
    })

    // The field ID should be 'config-some_field-nested' based on the fieldId computation
    cy.get('.referable-field-link').should('exist')
  })
})
