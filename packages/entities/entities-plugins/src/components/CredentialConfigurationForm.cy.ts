import CredentialConfigurationForm from './CredentialConfigurationForm.vue'
import basicAuthCredentialSchema from '../definitions/schemas/credentials/mockedBasicAuthSchema.json'
import type { KonnectPluginFormConfig } from '../types'

const baseConfig: KonnectPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'abc-123-i-love-cats',
}

describe('<CredentialConfigurationForm />', () => {
  it('prefills the form from the record and only emits schema fields', () => {
    const onUpdate = cy.spy().as('updateSpy')

    cy.mount(CredentialConfigurationForm, {
      props: {
        config: baseConfig,
        credentialType: 'basic-auth',
        editing: true,
        record: {
          id: 'cred-1',
          created_at: 1700516447,
          updated_at: 1700516447,
          consumer: { id: 'consumer-1' },
          username: 'kai',
          password: '',
        },
        'onUpdate:modelValue': onUpdate,
      },
    })

    cy.getTestId('ff-username').should('have.value', 'kai')
    cy.getTestId('ff-password').should('have.value', '')

    cy.getTestId('ff-username').type('-edited')
    cy.get('@updateSpy').should((spy: any) => {
      const model = spy.lastCall.args[0]
      expect(model).to.include({ username: 'kai-edited', password: '' })
      expect(model).to.not.have.any.keys('id', 'created_at', 'updated_at', 'consumer')
    })
  })

  it('renders the secret masked with a rotate action when editing', () => {
    cy.mount(CredentialConfigurationForm, {
      props: {
        config: baseConfig,
        credentialType: 'key-auth',
        editing: true,
        record: { id: 'cred-1', key: 'existing-key' },
      },
    })

    cy.getTestId('ff-key').find('[data-testid="sensitive-input"]').should('have.value', '••••••••••••••').and('have.attr', 'readonly')
    cy.getTestId('sensitive-input-rotate').click()
    cy.getTestId('ff-key').find('[data-testid="sensitive-input"]').should('have.value', 'existing-key').and('not.have.attr', 'readonly')
  })

  it('renders the secret as editable when creating', () => {
    cy.mount(CredentialConfigurationForm, {
      props: { config: baseConfig, credentialType: 'key-auth' },
    })

    cy.getTestId('sensitive-input-rotate').should('not.exist')
    cy.getTestId('ff-key').find('[data-testid="sensitive-input"]').should('not.have.attr', 'readonly')
  })

  it('uses the provided schema instead of fetching it', () => {
    cy.intercept('GET', '**/schemas/**', cy.spy().as('schemaRequest'))

    cy.mount(CredentialConfigurationForm, {
      props: {
        config: { app: 'kongManager', workspace: 'default', apiBaseUrl: '/kong-manager' },
        credentialType: 'basic-auth',
        schema: basicAuthCredentialSchema,
      },
    })

    cy.getTestId('ff-username').should('be.visible')
    cy.get('@schemaRequest').should('not.have.been.called')
  })
})
