// Import types for custom commands
/// <reference types="../../../../cypress/support" />

// Cypress component test spec file

import VueFormGenerator from '../FormGenerator.vue'
import { RLSchema, RLModel, customPluginSchema, customPluginModel, redisPartials, redisCEConfig } from '../../../fixtures/mockData'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../locales/en.json'

const baseConfigKM = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
}

describe('<VueFormGenerator />', () => {
  it('should show shared config/grouped redis fields when toggling shared/dedicated redis configuration', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials?size=1000`,
      },
      {
        statusCode: 200,
        body: {
          data: redisPartials,
          next: null,
        },
      },
    ).as('getPartials')
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/${redisPartials[0].id}`,
      },
      {
        statusCode: 200,
        body: redisCEConfig,
      },
    ).as('getRedisCEPartial')
    cy.mount(VueFormGenerator, {
      props: {
        schema: RLSchema,
        model: RLModel,
        enableRedisPartial: true,
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.vue-form-generator').should('exist')
    cy.getTestId('collapse-trigger-label').click()

    cy.getTestId('shared-redis-config-radio').click()
    const [redisCEConfigDetail, redisEEConfigDetail] = redisPartials
    cy.getTestId('redis-config-select').click()

    // should filter out EE plugins for CE plugin
    cy.getTestId(`redis-configuration-dropdown-item-${redisCEConfigDetail.name}`).should('exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisEEConfigDetail.name}`).should('not.exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisCEConfigDetail.name}`).click()
    cy.get('.partial-config-card').getTestId('name-property-value').should('contain.text', redisCEConfigDetail.name)

  })

  it('should show redis configuration selector in advanced fields in custom plugin form', () => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials?size=1000`,
      },
      {
        statusCode: 200,
        body: {
          data: redisPartials,
          next: null,
        },
      },
    ).as('getPartials')
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/${redisPartials[0].id}`,
      },
      {
        statusCode: 200,
        body: redisCEConfig,
      },
    ).as('getRedisCEPartial')
    const { t } = createI18n<typeof english>('en-us', english)
    cy.mount(VueFormGenerator, {
      props: {
        schema: customPluginSchema,
        model: customPluginModel,
        enableRedisPartial: true,
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.vue-form-generator').should('exist')
    cy.getTestId('collapse-trigger-label').click()
    cy.getTestId('custom-plugin-redis-config-note').should('contain.text', t('redis.custom_plugin.alert'))
    cy.getTestId('redis-config-select').click()

    // all redis partials(CE/EE) are present in the redis configuration selector in a custom plugin form
    for (const partial of redisPartials) {
      cy.getTestId(`redis-configuration-dropdown-item-${partial.name}`).should('exist')
    }

    const [redisCEConfigDetail] = redisPartials
    cy.getTestId(`redis-configuration-dropdown-item-${redisCEConfigDetail.name}`).click()
    cy.get('.partial-config-card').getTestId('name-property-value').should('contain.text', redisCEConfigDetail.name)

  })
})
