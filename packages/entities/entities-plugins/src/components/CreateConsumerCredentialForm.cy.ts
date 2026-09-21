import CreateConsumerCredentialForm from './CreateConsumerCredentialForm.vue'
import type { KonnectPluginFormConfig } from '../types'

const baseConfig: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
}

describe('<CreateConsumerCredentialForm />', () => {
  const interceptCreateConsumer = (status = 200): void => {
    cy.intercept(
      {
        method: 'POST',
        url: `${baseConfig.apiBaseUrl}/v2/control-planes/${baseConfig.controlPlaneId}/core-entities/consumers`,
      },
      {
        statusCode: status,
        body: status === 200 ? { id: 'consumer-1', username: 'kai' } : { message: 'failed to create consumer' },
      },
    ).as('createConsumer')
  }

  const interceptCreateCredential = (status = 200): void => {
    cy.intercept(
      {
        method: 'POST',
        url: `${baseConfig.apiBaseUrl}/v2/control-planes/${baseConfig.controlPlaneId}/core-entities/consumers/consumer-1/key-auth`,
      },
      {
        statusCode: status,
        body: status === 200 ? { id: 'cred-1', key: 'kong-key' } : { message: 'failed to create credential' },
      },
    ).as('createCredential')
  }

  it('creates a consumer, then a credential, and emits success with both', () => {
    interceptCreateConsumer()
    interceptCreateCredential()

    cy.mount(CreateConsumerCredentialForm, {
      props: {
        config: baseConfig,
        onSuccess: cy.spy().as('successSpy'),
        credentialType: 'key-auth',
      },
    })

    cy.getTestId('consumer-form-username').type('kai')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createConsumer')

    cy.getTestId('wizard-stepper').should('contain.text', 'Credential')
    cy.getTestId('ff-key').type('kong-key')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createCredential')

    cy.get('@successSpy').should('have.been.calledWithMatch', {
      consumer: { id: 'consumer-1' },
      credential: { id: 'cred-1' },
    })
  })

  it('stays on step 1 and shows an error when consumer creation fails', () => {
    interceptCreateConsumer(500)

    cy.mount(CreateConsumerCredentialForm, {
      props: { config: baseConfig, credentialType: 'key-auth' },
    })

    cy.getTestId('consumer-form-username').type('kai')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createConsumer')

    cy.getTestId('wizard-error').should('be.visible')
    cy.getTestId('consumer-form-username').should('exist')
    cy.getTestId('wizard-stepper').should('contain.text', 'Consumer')
  })

  it('stays on step 2 and shows an error when credential creation fails', () => {
    interceptCreateConsumer()
    interceptCreateCredential(500)

    cy.mount(CreateConsumerCredentialForm, {
      props: { config: baseConfig, credentialType: 'key-auth' },
    })

    cy.getTestId('consumer-form-username').type('kai')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createConsumer')

    cy.getTestId('ff-key').type('kong-key')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createCredential')

    cy.getTestId('wizard-error').should('be.visible')
    cy.getTestId('ff-key').should('exist')
  })

  it('emits cancel when "Exit setup" is clicked on step 1', () => {
    cy.mount(CreateConsumerCredentialForm, {
      props: { config: baseConfig, onCancel: cy.spy().as('cancelSpy'), credentialType: 'key-auth' },
    })

    cy.getTestId('wizard-secondary-action').should('contain.text', 'Exit setup')
    cy.getTestId('wizard-secondary-action').click()
    cy.get('@cancelSpy').should('have.been.called')
  })

  it('treats "Skip" on step 2 as a partial success, keeping the created consumer', () => {
    interceptCreateConsumer()

    cy.mount(CreateConsumerCredentialForm, {
      props: {
        config: baseConfig,
        onSuccess: cy.spy().as('successSpy'),
        credentialType: 'key-auth',
      },
    })

    cy.getTestId('consumer-form-username').type('kai')
    cy.getTestId('wizard-primary-action').click()
    cy.wait('@createConsumer')

    cy.getTestId('wizard-secondary-action').should('contain.text', 'Skip')
    cy.getTestId('wizard-secondary-action').click()

    cy.get('@successSpy').should('have.been.calledWithMatch', {
      consumer: { id: 'consumer-1' },
      credential: null,
    })
  })
})
