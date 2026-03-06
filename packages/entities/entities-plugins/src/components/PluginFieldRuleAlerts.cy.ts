// Cypress component test spec file
import PluginFieldRuleAlerts from './PluginFieldRuleAlerts.vue'
import type { FieldRules } from '../types'

describe('<PluginFieldRuleAlerts />', () => {
  it('should render atLeastOneOf rules', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_one', 'config.field_two'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    cy.get('.plugin-field-rule-alerts ul li').should('have.length', 1)
    cy.get('.referable-field-link').should('have.length', 2)
    cy.get('.referable-field-link').first().should('contain.text', 'Field One')
    cy.get('.referable-field-link').last().should('contain.text', 'Field Two')
  })

  it('should render multiple atLeastOneOf rules', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_a', 'config.field_b'],
        ['config.field_c', 'config.field_d', 'config.field_e'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 2)
    cy.get('.referable-field-link').should('have.length', 5)
  })

  it('should render onlyOneOf rules', () => {
    const rules: FieldRules = {
      onlyOneOf: [
        ['config.allow', 'config.deny'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    cy.get('.referable-field-link').should('have.length', 2)
    cy.get('.referable-field-link').first().should('contain.text', 'Allow')
    cy.get('.referable-field-link').last().should('contain.text', 'Deny')
  })

  it('should render mutuallyRequired rules', () => {
    const rules: FieldRules = {
      mutuallyRequired: [
        ['config.username', 'config.password'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    cy.get('.referable-field-link').should('have.length', 2)
    cy.get('.referable-field-link').first().should('contain.text', 'Username')
    cy.get('.referable-field-link').last().should('contain.text', 'Password')
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

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    // Should have the header text
    cy.get('.plugin-field-rule-alerts').should('contain.text', 'Exactly one of the following parameter combinations is required')
    // Should have 2 combinations in nested ul
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

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    // Should have 2 rule groups (each with the header)
    cy.get('.plugin-field-rule-alerts ul > li:last-child > div').should('have.length', 2)
    // Should have 4 combinations total (2 per rule group)
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

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    // Should have 3 top-level list items for the 3 different rule types
    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 3)
    // Total of 6 field links
    cy.get('.referable-field-link').should('have.length', 6)
  })

  it('should not render when no rules are provided', () => {
    const rules: FieldRules = {}

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    // Empty ul or ul with no li children
    cy.get('.plugin-field-rule-alerts ul > li').should('have.length', 0)
  })

  it('should properly separate fields with commas', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_a', 'config.field_b', 'config.field_c'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    // First two fields should be followed by commas
    cy.get('.referable-field-link').eq(0).parent().should('contain.text', ',')
    cy.get('.referable-field-link').eq(1).parent().should('contain.text', ',')
    // Last field should not have a comma
    cy.get('.referable-field-link').eq(2).parent().should('not.contain.text', ',')
  })

  it('should handle real-world ip-restriction plugin rules', () => {
    const rules: FieldRules = {
      atLeastOneOf: [['config.allow', 'config.deny']],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    cy.get('.referable-field-link').should('have.length', 2)
    cy.contains('At least one of the following values is required')
  })

  it('should handle real-world acl plugin rules', () => {
    const rules: FieldRules = {
      onlyOneOf: [['config.allow', 'config.deny']],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
    cy.get('.referable-field-link').should('have.length', 2)
    cy.contains('Exactly one of these parameters is required')
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

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('be.visible')
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

    // Create a target label element
    cy.document().then((doc) => {
      const label = doc.createElement('label')
      label.setAttribute('for', 'config-test_field')
      label.textContent = 'Test Field'
      label.style.marginTop = '2000px'
      doc.body.appendChild(label)
    })

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    // Spy on window.scrollTo
    cy.window().then((win) => {
      cy.spy(win, 'scrollTo').as('scrollToSpy')
    })

    // Click the field link
    cy.get('.referable-field-link').click()

    // Verify scrollTo was called
    cy.get('@scrollToSpy').should('have.been.called')
  })

  it('should have proper spacing styles', () => {
    const rules: FieldRules = {
      atLeastOneOf: [
        ['config.field_one'],
      ],
    }

    cy.mount(PluginFieldRuleAlerts, {
      props: {
        rules,
      },
    })

    cy.get('.plugin-field-rule-alerts').should('have.css', 'margin-top')
    cy.get('.plugin-field-rule-alerts').should('have.css', 'margin-bottom')
  })
})
