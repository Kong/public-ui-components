import { h } from 'vue'
import Form from './Form.vue'
import EnumField from './EnumField.vue'
import type { FormSchema, StringFieldSchema } from '../form-schema'
import type { FormConfig } from '../types'

const FIELD_NAME = 'protocols'

function getMultiEnumSchema(required = false): FormSchema {
  return {
    type: 'record',
    fields: [
      {
        [FIELD_NAME]: {
          type: 'set',
          elements: {
            type: 'string',
            one_of: ['http', 'https', 'grpc'],
          },
          ...(required ? { required: true } : {}),
        },
      },
    ],
  }
}

function mountEnumForm(options: {
  required?: boolean
  data: Record<string, unknown>
  onUpdate?: (value: string | string[] | null) => void
  config?: FormConfig
}) {
  const props = {
    schema: getMultiEnumSchema(options.required),
    data: options.data,
    config: options.config,
    onChange: cy.spy().as('onChangeSpy'),
  }

  if (options.onUpdate) {
    cy.mount(() => h(Form, props, {
      default: () => h(EnumField, {
        name: FIELD_NAME,
        multiple: true,
        onUpdate: options.onUpdate,
      }),
    }))

    return
  }

  cy.mount(Form, {
    props,
  })
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

function removeSelectedValue(value: string) {
  // Avoid `.findTestId()` here: it wraps the matched badge with `cy.wrap()`,
  // which pins a specific DOM node and breaks Cypress's ability to requery
  // the chain if KMultiselect re-renders its badges mid-retry (flaky
  // "subject is no longer attached to the DOM" failures). Using `.find()`
  // directly keeps this a single retryable chain rooted at `cy.getTestId()`.
  cy.getTestId(`ff-${FIELD_NAME}`)
    .contains('.multiselect-selection-badge', new RegExp(value, 'i'))
    .find('[data-testid="badge-dismiss-button"]')
    .click()
}

describe('EnumField', () => {
  it('should emit [] when clearing all selections from required multiselect', () => {
    mountEnumForm({
      required: true,
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: [] })
  })

  it('should emit null when clearing all selections from optional multiselect', () => {
    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: null })
  })

  it('should emit the remaining selections after a partial deselect', () => {
    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
    })

    removeSelectedValue('grpc')

    assertLastChange({ [FIELD_NAME]: ['http'] })
  })

  it('should emit null from @update when clearing all selections from optional multiselect', () => {
    const onUpdateSpy = cy.spy().as('onUpdateSpy')

    mountEnumForm({
      data: { [FIELD_NAME]: ['http', 'grpc'] },
      onUpdate: onUpdateSpy,
    })

    removeSelectedValue('http')
    removeSelectedValue('grpc')

    cy.get('@onUpdateSpy').should((spy: any) => {
      expect(spy.lastCall?.args[0]).to.equal(null)
    })
  })

  describe('version gating', () => {
    const VERSION_FIELD_NAME = 'auth_type'

    function getVersionGatedSchema(fieldOverrides: Partial<StringFieldSchema> = {}): FormSchema {
      return {
        type: 'record',
        fields: [
          {
            [VERSION_FIELD_NAME]: {
              type: 'string',
              one_of: ['consumer', 'credential', 'service'],
              enum_min_versions: [
                { min_ai_gateway_version: '2.1', value: 'credential' },
                { min_ai_gateway_version: '2.1', value: 'service' },
              ],
              ...fieldOverrides,
            },
          },
        ],
      }
    }

    function mountVersionGatedForm(options: {
      config?: FormConfig
      fieldOverrides?: Partial<StringFieldSchema>
    } = {}) {
      cy.mount(Form, {
        props: {
          schema: getVersionGatedSchema(options.fieldOverrides),
          data: { [VERSION_FIELD_NAME]: 'consumer' },
          config: options.config,
        },
      })
    }

    function openDropdown() {
      cy.getTestId(`ff-${VERSION_FIELD_NAME}`).click()
    }

    it('disables one_of options below minRuntimeVersion and shows a version tooltip', () => {
      mountVersionGatedForm({ config: { minRuntimeVersion: '2.0' } })
      openDropdown()

      cy.getTestId('select-item-consumer').find('button').should('not.be.disabled')
      cy.getTestId('select-item-credential').find('button').should('be.disabled')
      cy.getTestId('select-item-service').find('button').should('be.disabled')
      cy.getTestId('ff-version-tooltip-item-credential')
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('does not disable options, and shows no version tooltip, when minRuntimeVersion satisfies the requirement', () => {
      mountVersionGatedForm({ config: { minRuntimeVersion: '2.1' } })
      openDropdown()

      cy.getTestId('select-item-credential').find('button').should('not.be.disabled')
      cy.getTestId('select-item-service').find('button').should('not.be.disabled')
      cy.getTestId('ff-version-tooltip-item-credential').should('not.exist')
    })

    it('fails open (no option disabled) when minRuntimeVersion is not provided', () => {
      mountVersionGatedForm()
      openDropdown()

      cy.getTestId('select-item-credential').find('button').should('not.be.disabled')
      cy.getTestId('select-item-service').find('button').should('not.be.disabled')
    })

    it('disables the whole field and shows a version tooltip when the field itself is version-gated', () => {
      mountVersionGatedForm({
        config: { minRuntimeVersion: '2.0' },
        fieldOverrides: { min_ai_gateway_version: '2.1', enum_min_versions: undefined },
      })

      cy.getTestId(`ff-${VERSION_FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-version-tooltip-${VERSION_FIELD_NAME}`)
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('does not disable the field, and shows no version tooltip, when minRuntimeVersion satisfies the field-level requirement', () => {
      mountVersionGatedForm({
        config: { minRuntimeVersion: '2.1' },
        fieldOverrides: { min_ai_gateway_version: '2.1', enum_min_versions: undefined },
      })

      cy.getTestId(`ff-${VERSION_FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-version-tooltip-${VERSION_FIELD_NAME}`).should('not.exist')
    })

    it('ignores gating entirely when config.versionGating is false', () => {
      mountVersionGatedForm({ config: { minRuntimeVersion: '2.0', versionGating: false } })
      openDropdown()

      cy.getTestId('select-item-credential').find('button').should('not.be.disabled')
      cy.getTestId('select-item-service').find('button').should('not.be.disabled')
      cy.getTestId('ff-version-tooltip-item-credential').should('not.exist')
    })
  })

  describe('emptyFieldValue config', () => {
    it('should emit undefined when clearing all selections from optional multiselect with emptyFieldValue: undefined', () => {
      mountEnumForm({
        data: { [FIELD_NAME]: ['http', 'grpc'] },
        config: { emptyFieldValue: 'undefined' },
      })

      removeSelectedValue('http')
      removeSelectedValue('grpc')

      assertLastChange({ [FIELD_NAME]: undefined })
    })

    it('should still emit [] when clearing all selections from required multiselect with emptyFieldValue: undefined', () => {
      mountEnumForm({
        required: true,
        data: { [FIELD_NAME]: ['http', 'grpc'] },
        config: { emptyFieldValue: 'undefined' },
      })

      removeSelectedValue('http')
      removeSelectedValue('grpc')

      assertLastChange({ [FIELD_NAME]: [] })
    })
  })
})
