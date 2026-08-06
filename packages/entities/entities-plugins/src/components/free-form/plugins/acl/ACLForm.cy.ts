import ACLForm from './ACLForm.vue'
import aclSchema, { aclSchemaWithoutWhenModes } from '../../../../../fixtures/schemas/acl'
import type { FormSchema } from '../../../../types/plugins/form-schema'

interface MountOptions {
  schema?: FormSchema
  model?: Record<string, any>
}

const mountForm = (options: MountOptions = {}) => {
  const { schema = aclSchema, model = { config: {} } } = options

  cy.mount(ACLForm as any, {
    props: {
      schema,
      formSchema: { fields: [] },
      formModel: {},
      model,
      isEditing: false,
      pluginName: 'acl',
      onFormChange: cy.spy().as('onFormChange'),
    },
  })
}

const lastFormChange = () => cy.get('@onFormChange').its('lastCall').its('args.0')

describe('<ACLForm /> - mode switching', () => {
  it('defaults to the allow mode with the allow field visible', () => {
    mountForm()

    cy.getTestId('ff-acl-mode-allow').should('be.checked')
    cy.getTestId('ff-array-config.allow').should('exist')
    cy.getTestId('ff-array-config.deny').should('not.exist')
  })

  it('pre-selects the mode that already has data on load', () => {
    mountForm({ model: { config: { deny_when: ['request.method == "GET"'] } } })

    cy.getTestId('ff-acl-mode-deny_when').should('be.checked')
    cy.getTestId('ff-array-config.deny_when').should('exist')
  })

  it('switches the checked radio and the rendered field when a new mode is picked', () => {
    mountForm()

    cy.getTestId('ff-acl-mode-deny').click()
    cy.getTestId('ff-acl-mode-allow').should('not.be.checked')
    cy.getTestId('ff-acl-mode-deny').should('be.checked')
    cy.getTestId('ff-array-config.deny').should('exist')
    cy.getTestId('ff-array-config.allow').should('not.exist')

    cy.getTestId('ff-acl-mode-allow_when').click()
    cy.getTestId('ff-acl-mode-deny').should('not.be.checked')
    cy.getTestId('ff-acl-mode-allow_when').should('be.checked')
    cy.getTestId('ff-array-config.allow_when').should('exist')
    cy.getTestId('ff-array-config.deny').should('not.exist')
  })

  it('shows the correct field label after switching modes (no stale label from a reused Field instance)', () => {
    mountForm()

    cy.getTestId('ff-label-config.allow').should('contain.text', 'Allow')

    cy.getTestId('ff-acl-mode-deny').click()
    cy.getTestId('ff-label-config.deny').should('contain.text', 'Deny')
    cy.getTestId('ff-label-config.allow').should('not.exist')

    cy.getTestId('ff-acl-mode-allow_when').click()
    cy.getTestId('ff-label-config.allow_when').should('contain.text', 'Allow when')
    cy.getTestId('ff-label-config.deny').should('not.exist')
  })

  it('clears the previous mode\'s data when switching', () => {
    mountForm({ model: { config: { allow: ['group-a', 'group-b'] } } })

    cy.getTestId('ff-acl-mode-deny').click()
    lastFormChange().its('config.allow').should('be.null')
    lastFormChange().its('config.allow_when').should('be.null')
    lastFormChange().its('config.deny_when').should('be.null')
    // `deny` is the newly-active mode and was never assigned a value in this
    // scenario, so it may come back as `null` or simply be absent — either is fine.
    lastFormChange().its('config').should('satisfy', (config: Record<string, unknown>) => config.deny == null)
  })

  it('restores cached data when switching back to a previously-filled mode', () => {
    mountForm({ model: { config: { allow: ['group-a'] } } })

    cy.getTestId('ff-acl-mode-deny').click()
    cy.getTestId('ff-acl-mode-allow').click()

    cy.getTestId('ff-array-item-config.allow.0').should('exist')
    cy.getTestId('ff-config.allow.0').should('have.value', 'group-a')
  })

  it('hides the allow_when/deny_when modes when the schema does not declare them', () => {
    mountForm({ schema: aclSchemaWithoutWhenModes })

    cy.getTestId('ff-acl-mode-allow').should('exist')
    cy.getTestId('ff-acl-mode-deny').should('exist')
    cy.getTestId('ff-acl-mode-allow_when').should('not.exist')
    cy.getTestId('ff-acl-mode-deny_when').should('not.exist')
  })
})
