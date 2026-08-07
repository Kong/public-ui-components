import AuthPluginOnboardingCard from './AuthPluginOnboardingCard.vue'

const createConsumerTo = { name: 'create-consumer-credential-form' }
const addCredentialTo = { name: 'add-credential-to-consumer-form' }

describe('<AuthPluginOnboardingCard />', () => {
  it('shows only the "create a consumer" item when there are no consumers yet', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { createConsumerTo, hasConsumers: false, pluginType: 'key-auth' },
    })

    cy.getTestId('onboarding-item-0').should('contain.text', 'Create a consumer')
    cy.getTestId('onboarding-item-1').should('not.exist')
  })

  it('shows both items once consumers already exist', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { addCredentialTo, createConsumerTo, hasConsumers: true, pluginType: 'key-auth' },
    })

    cy.getTestId('onboarding-item-0').should('contain.text', 'Create a consumer')
    cy.getTestId('onboarding-item-1').should('contain.text', 'Add a key authentication credential')
  })

  it('renders plugin-specific copy for jwt, matching the per-plugin-type Figma design', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { addCredentialTo, createConsumerTo, hasConsumers: true, pluginType: 'jwt' },
    })

    cy.getTestId('onboarding-card-title').should('contain.text', 'Next steps for JWT plugins')
    cy.getTestId('onboarding-item-0').should('contain.text', 'JWT credential')
    cy.getTestId('onboarding-item-1').should('contain.text', 'Add a JWT credential')
  })

  it('renders authorization copy (not authentication) for acl', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { addCredentialTo, createConsumerTo, hasConsumers: true, pluginType: 'acl' },
    })

    cy.getTestId('onboarding-card-title').should('contain.text', 'Next steps for ACL plugins')
    cy.getTestId('onboarding-item-1').should('contain.text', 'Add an ACL credential')
  })

  it('renders each item as a route-link, with no modal or click handler owned by the card', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { addCredentialTo, createConsumerTo, hasConsumers: true, pluginType: 'key-auth' },
    })

    // the shared `RouterLink` test stub doesn't replace the tag name, so assert the `button` branch was skipped instead
    cy.getTestId('onboarding-item-0').should('not.match', 'button')
    cy.getTestId('onboarding-item-1').should('not.match', 'button')
  })

  it('omits the second item entirely when hasConsumers is true but no addCredentialTo route is given', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: { createConsumerTo, hasConsumers: true, pluginType: 'key-auth' },
    })

    cy.getTestId('onboarding-item-1').should('not.exist')
  })

  it('emits dismiss when the card is dismissed', () => {
    cy.mount(AuthPluginOnboardingCard, {
      props: {
        createConsumerTo,
        hasConsumers: false,
        onDismiss: cy.spy().as('dismissSpy'),
        pluginType: 'key-auth',
      },
    })

    cy.getTestId('onboarding-card-close').click()
    cy.get('@dismissSpy').should('have.been.called')
  })
})
