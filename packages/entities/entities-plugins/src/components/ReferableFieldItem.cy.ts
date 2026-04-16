// Cypress component test spec file
import ReferableFieldItem from './ReferableFieldItem.vue'

describe('<ReferableFieldItem />', () => {
  const mountComponent = (field: string, isLast?: boolean) => {
    cy.mount(ReferableFieldItem, {
      props: {
        field,
        ...(isLast !== undefined ? { isLast } : {}),
      },
    })
  }

  const addFieldLabelTarget = (forId: string) => {
    cy.document().then((doc) => {
      const label = doc.createElement('label')
      label.setAttribute('for', forId)
      label.textContent = 'Test Field'
      label.style.marginTop = '2000px'
      doc.body.appendChild(label)
    })
  }

  ;[
    {
      title: 'renders the field label correctly',
      field: 'config.my_field',
      expected: 'My Field',
    },
    {
      title: 'removes config prefix from label',
      field: 'config.upstream_host',
      expected: 'Upstream Host',
      noPrefix: true,
    },
    {
      title: 'handles nested field paths',
      field: 'config.redis.host',
      expected: 'Redis.Host',
    },
    {
      title: 'handles fields without config prefix',
      field: 'enabled',
      expected: 'Enabled',
    },
  ].forEach(({ title, field, expected, noPrefix }) => {
    it(`should ${title}`, () => {
      mountComponent(field, false)

      cy.get('.referable-field-link').should('be.visible').and('contain.text', expected)

      if (noPrefix) {
        cy.get('.referable-field-link').should('not.contain.text', 'config.')
      }
    })
  })

  ;[
    {
      title: 'show comma when isLast is false',
      field: 'config.field_one',
      isLast: false,
      hasComma: true,
    },
    {
      title: 'not show comma when isLast is true',
      field: 'config.field_last',
      isLast: true,
      hasComma: false,
    },
    {
      title: 'show comma when isLast is undefined (default false behavior)',
      field: 'config.field_default',
      isLast: undefined,
      hasComma: true,
    },
  ].forEach(({ title, field, isLast, hasComma }) => {
    it(`should ${title}`, () => {
      mountComponent(field, isLast)

      cy.get('.referable-field-link').parent().should(hasComma ? 'contain.text' : 'not.contain.text', ',')
    })
  })

  it('should be clickable', () => {
    mountComponent('config.clickable_field', false)

    cy.get('.referable-field-link').should('have.css', 'cursor', 'pointer')
  })

  it('should have underline decoration', () => {
    mountComponent('config.underlined_field', false)

    cy.get('.referable-field-link')
      .invoke('css', 'text-decoration')
      .should('match', /underline/)
  })

  it('should attempt to scroll when clicked', () => {
    addFieldLabelTarget('config-test_field')
    mountComponent('config.test_field', false)

    cy.window().then((win) => {
      cy.spy(win, 'scrollTo').as('scrollToSpy')
    })

    cy.get('.referable-field-link').click()
    cy.get('@scrollToSpy').should('have.been.called')
  })

  it('should correctly format field IDs for querySelector', () => {
    mountComponent('config.some_field.nested', true)

    cy.get('.referable-field-link').should('exist')
  })
})
