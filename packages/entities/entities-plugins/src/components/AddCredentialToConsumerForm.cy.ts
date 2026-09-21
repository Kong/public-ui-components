import AddCredentialToConsumerForm from './AddCredentialToConsumerForm.vue'
import type { KonnectPluginFormConfig } from '../types'

const baseConfig: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
}

const consumer = { id: 'consumer-1', username: 'kai' }

describe('<AddCredentialToConsumerForm />', () => {
  const interceptConsumersList = (mockData: Array<Record<string, any>> = []): void => {
    cy.intercept(
      {
        method: 'GET',
        url: `${baseConfig.apiBaseUrl}/v2/control-planes/${baseConfig.controlPlaneId}/core-entities/consumers*`,
      },
      {
        statusCode: 200,
        body: { data: mockData, total: mockData.length },
      },
    ).as('listConsumers')
  }

  it('disables the primary action until a consumer is selected', () => {
    interceptConsumersList([consumer])

    cy.mount(AddCredentialToConsumerForm, {
      props: { config: baseConfig, credentialType: 'key-auth' },
    })

    cy.wait('@listConsumers')
    cy.getTestId('other-create-form-submit').should('be.disabled')

    cy.getTestId('choose-consumer-select').click()
    cy.getTestId(`select-item-${consumer.id}`).click()

    cy.getTestId('ff-key').should('exist')
  })

  it('submits the credential for the selected consumer and emits success', () => {
    interceptConsumersList([consumer])
    cy.intercept(
      {
        method: 'POST',
        url: `${baseConfig.apiBaseUrl}/v2/control-planes/${baseConfig.controlPlaneId}/core-entities/consumers/${consumer.id}/key-auth`,
      },
      { statusCode: 200, body: { id: 'cred-1', key: 'kong-key' } },
    ).as('createCredential')

    cy.mount(AddCredentialToConsumerForm, {
      props: { config: baseConfig, onSuccess: cy.spy().as('successSpy'), credentialType: 'key-auth' },
    })

    cy.wait('@listConsumers')
    cy.getTestId('choose-consumer-select').click()
    cy.getTestId(`select-item-${consumer.id}`).click()

    cy.getTestId('ff-key').type('kong-key')
    cy.getTestId('other-create-form-submit').click()

    cy.wait('@createCredential')
    cy.get('@successSpy').should('have.been.calledWithMatch', { id: 'cred-1' })
  })

  it('emits cancel when Cancel is clicked', () => {
    interceptConsumersList([])

    cy.mount(AddCredentialToConsumerForm, {
      props: { config: baseConfig, onCancel: cy.spy().as('cancelSpy'), credentialType: 'key-auth' },
    })

    cy.wait('@listConsumers')
    cy.getTestId('other-create-form-cancel').click()
    cy.get('@cancelSpy').should('have.been.called')
  })
})
