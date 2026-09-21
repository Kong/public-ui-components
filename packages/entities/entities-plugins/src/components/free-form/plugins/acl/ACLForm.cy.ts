import ACLForm from './ACLForm.vue'
import aclSchema, { aclSchemaWithoutWhenModes, aclSchemaWithVersionGates } from '../../../../../fixtures/schemas/acl'
import type { FormConfig, FormSchema } from '@kong-ui-public/freeform'

interface MountOptions {
  schema?: FormSchema
  model?: Record<string, any>
  formConfig?: FormConfig
}

const mountForm = (options: MountOptions = {}) => {
  const { schema = aclSchema, model = { config: {} }, formConfig } = options

  cy.mount(ACLForm as any, {
    props: {
      schema,
      formConfig,
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

    cy.getTestId('ff-label-config.allow').should('contain.text', 'Allowed list')

    cy.getTestId('ff-acl-mode-deny').click()
    cy.getTestId('ff-label-config.deny').should('contain.text', 'Denied list')
    cy.getTestId('ff-label-config.allow').should('not.exist')

    cy.getTestId('ff-acl-mode-allow_when').click()
    cy.getTestId('ff-label-config.allow_when').should('contain.text', 'Kong plug-in conditional expression')
    cy.getTestId('ff-label-config.deny').should('not.exist')
  })

  it('labels the add-item button per mode', () => {
    mountForm()

    cy.getTestId('ff-add-item-btn-config.allow').should('contain.text', 'Add allow')

    cy.getTestId('ff-acl-mode-deny_when').click()
    cy.getTestId('ff-add-item-btn-config.deny_when').should('contain.text', 'Add expression')
  })

  it('renders group modes as inputs and expression modes as textareas with help', () => {
    mountForm()

    cy.getTestId('ff-array-item-config.allow.0').find('input').should('exist')
    cy.getTestId('ff-array-item-config.allow.0').find('textarea').should('not.exist')
    cy.getTestId('ff-config.allow.0').should('have.attr', 'placeholder', 'Enter group names')
    cy.getTestId('ff-array-item-config.allow.0').find('a[href]').should('not.exist')

    cy.getTestId('ff-acl-mode-allow_when').click()
    cy.getTestId('ff-array-item-config.allow_when.0').find('textarea').should('exist')
    cy.getTestId('ff-array-item-config.allow_when.0')
      .find('a[href]')
      .should('contain.text', 'Learn more')
  })

  it('seeds an empty row by default so the input shows without clicking "Add"', () => {
    mountForm()

    cy.getTestId('ff-array-item-config.allow.0').should('exist')

    cy.getTestId('ff-acl-mode-deny_when').click()
    cy.getTestId('ff-array-item-config.deny_when.0').should('exist')
  })

  it('does not let the last remaining row be removed', () => {
    mountForm()

    cy.getTestId('ff-array-remove-item-btn-config.allow.0').should('not.be.visible')

    cy.getTestId('ff-add-item-btn-config.allow').click()
    cy.getTestId('ff-array-remove-item-btn-config.allow.0').should('be.visible')
    cy.getTestId('ff-array-remove-item-btn-config.allow.1').should('be.visible')

    cy.getTestId('ff-array-remove-item-btn-config.allow.1').click()
    cy.getTestId('ff-array-remove-item-btn-config.allow.0').should('not.be.visible')
  })

  it('clears the previous mode\'s data when switching', () => {
    mountForm({ model: { config: { allow: ['group-a', 'group-b'] } } })

    cy.getTestId('ff-acl-mode-deny').click()
    lastFormChange().its('config.allow').should('be.null')
    lastFormChange().its('config.allow_when').should('be.null')
    lastFormChange().its('config.deny_when').should('be.null')
    // `deny` is the newly-active mode; it was never assigned a value in this
    // scenario, so switching to it seeds a single empty row instead of leaving
    // it blank.
    lastFormChange().its('config.deny').should('deep.equal', [null])
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

describe('<ACLForm /> - version gating', () => {
  it('disables the CEL modes, but not allow/deny, when minRuntimeVersion is below their requirement', () => {
    mountForm({ schema: aclSchemaWithVersionGates, formConfig: { minRuntimeVersion: '2.0' } })

    cy.getTestId('ff-acl-mode-allow').should('not.be.disabled')
    cy.getTestId('ff-acl-mode-deny').should('not.be.disabled')
    cy.getTestId('ff-acl-mode-allow_when').should('be.disabled')
    cy.getTestId('ff-acl-mode-deny_when').should('be.disabled')
    cy.getTestId('ff-version-tooltip-allow_when').should('contain.text', 'The minimum runtime version required to use this feature is 2.1')

    // The VersionGateTooltip wrapper (gated modes only) must not change the
    // card's size relative to its ungated siblings — the wrapper participates
    // in the row as a plain flex item, same as a bare KRadio.
    cy.getTestId('ff-acl-mode-allow').then(($allow) => {
      const { height, width } = $allow[0].getBoundingClientRect()

      cy.getTestId('ff-acl-mode-allow_when')
        .should(($gated) => {
          const box = $gated[0].getBoundingClientRect()
          expect(box.height).to.eq(height)
          // Widths are content-based; the wrapped card must shrink with the row
          // like its siblings instead of holding its max-content width.
          expect(box.width).to.be.at.most(width * 1.2)
        })
    })
  })

  it('keeps all modes selectable when minRuntimeVersion satisfies the requirement', () => {
    mountForm({ schema: aclSchemaWithVersionGates, formConfig: { minRuntimeVersion: '2.1' } })

    cy.getTestId('ff-acl-mode-allow_when').should('not.be.disabled')
    cy.getTestId('ff-acl-mode-deny_when').should('not.be.disabled')
  })

  it('fails open (all modes selectable) when minRuntimeVersion is not provided', () => {
    mountForm({ schema: aclSchemaWithVersionGates })

    cy.getTestId('ff-acl-mode-allow_when').should('not.be.disabled')
    cy.getTestId('ff-acl-mode-deny_when').should('not.be.disabled')
  })

  it('ignores gating entirely when formConfig.versionGating is false', () => {
    mountForm({ schema: aclSchemaWithVersionGates, formConfig: { minRuntimeVersion: '2.0', versionGating: false } })

    cy.getTestId('ff-acl-mode-allow_when').should('not.be.disabled')
    cy.getTestId('ff-acl-mode-deny_when').should('not.be.disabled')
  })
})
