// Import types for custom commands
/// <reference types="../../../../../cypress/support" />

// Cypress component test spec file

import RLAForm from '../RLAForm.vue'
import { RLASchema, RLAModel } from './RLASchema'
import { redisPartials, redisEEConfig } from '../../../../fixtures/mockData'

const baseConfigKM = {
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
}

describe('<RLAForm />', () => {
  it('should render redis fields as common fields when enableRedisPartial is not passed', () => {
    cy.mount(RLAForm, {
      props: {
        formSchema: RLASchema,
        formModel: RLAModel,
        onModelUpdated: (value:any, model: Record<string, any>) => {
          console.log(value, model)
        },
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.rla-form-basic-fields').should('exist')
    cy.getTestId('collapse-trigger-label').click()
    cy.getTestId('config-strategy-items').click()
    cy.getTestId('select-item-local').should('be.visible').click()
    cy.getTestId('select-item-redis').click()

    cy.getTestId('redis-config-radio-group').should('not.exist')
    cy.get('.rla-form-redis-card').should('exist')

  })

  it('should show corresponding configuration when toggling shared/dedicated redis configuration', () => {
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
        url: `${baseConfigKM.apiBaseUrl}/${baseConfigKM.workspace}/partials/${redisPartials[1].id}`,
      },
      {
        statusCode: 200,
        body: redisEEConfig,
      },
    ).as('getRedisEEPartial')
    cy.mount(RLAForm, {
      props: {
        formSchema: RLASchema,
        formModel: RLAModel,
        enableRedisPartial: true,
        onModelUpdated: (value: any, model: Record<string, any>) => {
          console.log(value, model)
        },
      },
      global: {
        provide: {
          'kong-ui-forms-config': baseConfigKM,
        },
      },
    })
    cy.get('.rla-form-basic-fields').should('exist')
    cy.getTestId('collapse-trigger-label').click()
    cy.getTestId('config-strategy-items').click()
    cy.getTestId('select-item-redis').should('be.visible')
    cy.get('[data-testid="select-item-redis"] button').click()
    cy.getTestId('redis-config-card').should('exist')


    cy.get('.dedicated-redis-config-title').should('contain.text', 'Connection Settings')
    cy.getTestId('shared-redis-config-radio').click()
    cy.getTestId('redis-config-select').click()

    const [redisCEConfigDetail, redisEEConfigDetail] = redisPartials
    // should filter out CE partials for EE plugin
    cy.getTestId(`redis-configuration-dropdown-item-${redisEEConfigDetail.name}`).should('exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisCEConfigDetail.name}`).should('not.exist')
    cy.getTestId(`redis-configuration-dropdown-item-${redisEEConfigDetail.name}`).click()
    cy.get('.partial-config-card').getTestId('name-property-value').should('contain.text', redisEEConfigDetail.name)

  })
})
