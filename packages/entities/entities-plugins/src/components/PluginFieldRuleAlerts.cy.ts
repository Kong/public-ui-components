// Cypress component test spec file
import PluginFieldRuleAlerts from './PluginFieldRuleAlerts.vue'
import type { FieldRules } from '../types'

describe('<PluginFieldRuleAlerts />', () => {
  const mountComponent = (rules: FieldRules) => {
    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })
    cy.get('.plugin-field-rule-alerts').should('be.visible')
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
      title: 'render atLeastOneOf rules',
      rules: {
        atLeastOneOf: [
          ['config.field_one', 'config.field_two'],
        ],
      } satisfies FieldRules,
      linkCount: 2,
      expectedLabels: ['Field One', 'Field Two'],
      topLevelItems: 1,
    },
    {
      title: 'render onlyOneOf rules',
      rules: {
        onlyOneOf: [
          ['config.allow', 'config.deny'],
        ],
      } satisfies FieldRules,
      linkCount: 2,
      expectedLabels: ['Allow', 'Deny'],
    },
    {
      title: 'render mutuallyRequired rules',
      rules: {
        mutuallyRequired: [
          ['config.username', 'config.password'],
        ],
      } satisfies FieldRules,
      linkCount: 2,
      expectedLabels: ['Username', 'Password'],
    },
    {
      title: 'handle real-world ip-restriction plugin rules',
      rules: {
        atLeastOneOf: [['config.allow', 'config.deny']],
      } satisfies FieldRules,
      linkCount: 2,
      expectedText: 'At least one of the following values is required',
    },
    {
      title: 'handle real-world acl plugin rules',
      rules: {
        onlyOneOf: [['config.allow', 'config.deny']],
      } satisfies FieldRules,
      linkCount: 2,
      expectedText: 'Exactly one of these parameters is required',
    },
  ].forEach(({ title, rules, linkCount, expectedLabels, expectedText, topLevelItems }) => {
    it(`should ${title}`, () => {
      mountComponent(rules)

      if (topLevelItems !== undefined) {
        cy.get('.plugin-field-rule-alerts ul > li').should('have.length', topLevelItems)
      }

      cy.get('.referable-field-link').should('have.length', linkCount)

      expectedLabels?.forEach((label, index) => {
        cy.get('.referable-field-link').eq(index).should('contain.text', label)
      })

      if (expectedText) {
        cy.contains(expectedText)
      }
    })
  })

  it('should render multiple atLeastOneOf rules', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_a', 'config.field_b'],
        ['config.field_c', 'config.field_d', 'config.field_e'],
      ],
    }

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 2)
    cy.get('.referable-field-link').should('have.length', 5)
  })

  it('should render onlyOneOfMutuallyRequired rules', () => {
    const rules: FieldRules = {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    }

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts').should('contain.text', 'Exactly one of the following parameter combinations is required')
    cy.get('.plugin-field-rule-alerts ul ul li').should('have.length', 2)
    cy.get('.referable-field-link').should('have.length', 4)
  })

  it('should render multiple onlyOneOfMutuallyRequired rules', () => {
    const rules: FieldRules = {
      onlyOneOfMutuallyRequired: [
        [
          ['config.field_a', 'config.field_b'],
          ['config.field_c', 'config.field_d'],
        ],
        [
          ['config.field_e', 'config.field_f'],
          ['config.field_g', 'config.field_h'],
        ],
      ],
    }

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts ul > li:last-child > div').should('have.length', 2)
    cy.get('.plugin-field-rule-alerts ul ul li').should('have.length', 4)
    cy.get('.referable-field-link').should('have.length', 8)
  })

  it('should render mixed rule types', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_one', 'config.field_two'],
      ],
      onlyOneOf: [
        ['config.allow', 'config.deny'],
      ],
      mutuallyRequired: [
        ['config.username', 'config.password'],
      ],
    }

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 3)
    cy.get('.referable-field-link').should('have.length', 6)
  })

  it('should not render when no rules are provided', () => {
    const rules: FieldRules = {}

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 0)
  })

  it('should properly separate fields with commas', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_a', 'config.field_b', 'config.field_c'],
      ],
    }

    mountComponent(rules)

    cy.get('.referable-field-link').eq(0).parent().should('contain.text', ',')
    cy.get('.referable-field-link').eq(1).parent().should('contain.text', ',')
    cy.get('.referable-field-link').eq(2).parent().should('not.contain.text', ',')
  })

  it('should handle real-world forward-proxy plugin rules', () => {
    const rules: FieldRules = {
      onlyOneOfMutuallyRequired: [
        [
          ['config.http_proxy_host', 'config.http_proxy_port'],
          ['config.https_proxy_host', 'config.https_proxy_port'],
        ],
      ],
    }

    mountComponent(rules)

    cy.contains('Exactly one of the following parameter combinations is required')
    cy.get('.referable-field-link').should('contain.text', 'Http Proxy Host')
    cy.get('.referable-field-link').should('contain.text', 'Http Proxy Port')
    cy.get('.referable-field-link').should('contain.text', 'Https Proxy Host')
    cy.get('.referable-field-link').should('contain.text', 'Https Proxy Port')
  })

  it('should allow clicking on field links', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.test_field'],
      ],
    }

    addFieldLabelTarget('config-test_field')
    mountComponent(rules)

    cy.window().then((win) => {
      cy.spy(win, 'scrollTo').as('scrollToSpy')
    })

    cy.get('.referable-field-link').click()
    cy.get('@scrollToSpy').should('have.been.called')
  })

  it('should have proper spacing styles', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_one'],
      ],
    }

    mountComponent(rules)

    cy.get('.plugin-field-rule-alerts')
      .invoke('css', 'margin-top')
      .should('not.equal', '0px')
    cy.get('.plugin-field-rule-alerts')
      .invoke('css', 'margin-bottom')
      .should('not.equal', '0px')
  })
})
