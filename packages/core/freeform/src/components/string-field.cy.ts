import { h } from 'vue'
import { AUTOFILL_SLOT } from '@kong-ui-public/forms'
import Form from './Form.vue'
import type { FormSchema, StringFieldSchema } from '../form-schema'
import type { FormConfig } from '../types'

const FIELD_NAME = 'name'

function createStringSchema(options: {
  required?: boolean
  defaultValue?: string
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'string',
        ...(options.required ? { required: true } : {}),
        ...(options.defaultValue !== undefined ? { default: options.defaultValue } : {}),
      },
    }],
  }
}

function mountStringForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown>
  config?: FormConfig
}) {
  cy.mount(Form, {
    props: {
      schema: options.schema ?? createStringSchema(),
      data: options.data,
      config: options.config,
      onChange: cy.spy().as('onChangeSpy'),
    },
  })
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

describe('StringField', () => {
  it('should emit null when clearing an optional field (default behavior)', () => {
    mountStringForm({
      data: { [FIELD_NAME]: 'alpha' },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit null when clearing an optional field with emptyFieldValue: null', () => {
      mountStringForm({
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'null' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: null })
    })

    it('should emit undefined when clearing an optional field with emptyFieldValue: undefined', () => {
      mountStringForm({
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      assertLastChange({ [FIELD_NAME]: undefined })
    })

    it('should emit undefined when clearing a required field with emptyFieldValue: undefined', () => {
      mountStringForm({
        schema: createStringSchema({ required: true }),
        data: { [FIELD_NAME]: 'alpha' },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId(`ff-${FIELD_NAME}`).clear()

      // Required-but-empty scalars still resolve through the same configurable
      // sentinel as optional fields — required-ness only forces structural
      // defaults (record/array/map), not scalars.
      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })

  it('should emit null instead of the default when clearing a required field with a default (never re-snaps to the default)', () => {
    mountStringForm({
      schema: createStringSchema({ required: true, defaultValue: 'preset' }),
      data: { [FIELD_NAME]: 'alpha' },
    })

    cy.getTestId(`ff-${FIELD_NAME}`).clear()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('version compatibility', () => {
    function mountVersionCompatibilityForm(options: {
      config?: FormConfig
      fieldOverrides?: Partial<StringFieldSchema>
    } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'string',
                min_ai_gateway_version: '2.1',
                ...options.fieldOverrides,
              },
            }],
          },
          data: { [FIELD_NAME]: 'alpha' },
          config: options.config,
        },
      })
    }

    it('disables the field and shows a version tooltip when minRuntimeVersion is below the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.0' } })

      cy.getTestId(`ff-${FIELD_NAME}`).should('be.disabled')
      cy.getTestId(`ff-label-${FIELD_NAME}`).find('[data-testid="kui-icon-wrapper-info-icon"]').should('exist')
      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .should('contain.text', 'The minimum runtime version required to use this feature is 2.1')
    })

    it('does not disable the field, and shows no version tooltip, when minRuntimeVersion satisfies the requirement', () => {
      mountVersionCompatibilityForm({ config: { minRuntimeVersion: '2.1' } })

      cy.getTestId(`ff-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-label-${FIELD_NAME}`).find('[data-testid="kui-icon-wrapper-info-icon"]').should('not.exist')
    })

    it('fails open (not disabled) when minRuntimeVersion is not provided', () => {
      mountVersionCompatibilityForm()

      cy.getTestId(`ff-${FIELD_NAME}`).should('not.be.disabled')
      cy.getTestId(`ff-label-${FIELD_NAME}`).find('[data-testid="kui-icon-wrapper-info-icon"]').should('not.exist')
    })

    it('shows the version note before the field description, with both merged into the same tooltip', () => {
      mountVersionCompatibilityForm({
        config: { minRuntimeVersion: '2.0' },
        fieldOverrides: { description: 'The display name for this consumer.' },
      })

      cy.getTestId(`ff-label-${FIELD_NAME}`).find('.ff-version-compatibility-note')
        .should('contain.text', 'minimum runtime version')
      cy.getTestId(`ff-label-${FIELD_NAME}`).find('.ff-label-tooltip-info')
        .should('contain.text', 'The display name for this consumer')
      cy.getTestId(`ff-label-${FIELD_NAME}`)
        .find('.ff-version-compatibility-note, .ff-label-tooltip-info')
        .first()
        .should('have.class', 'ff-version-compatibility-note')
    })
  })

  describe('vault picker', () => {
    const fakePicker = (props: any) => h('div', {
      'data-disabled': String(!!props.disabled),
      'data-testid': 'fake-vault-picker',
    }, 'picker')

    function mountWithVaultPicker(options: {
      config?: FormConfig
      fieldOverrides?: Partial<StringFieldSchema>
    } = {}) {
      cy.mount(Form, {
        props: {
          schema: {
            type: 'record',
            fields: [{
              [FIELD_NAME]: {
                type: 'string',
                referenceable: true,
                ...options.fieldOverrides,
              },
            }],
          },
          data: { [FIELD_NAME]: 'alpha' },
          config: options.config,
        },
        global: {
          provide: {
            [AUTOFILL_SLOT]: fakePicker,
          },
        },
      })
    }

    it('disables the vault picker when the field is version-locked', () => {
      mountWithVaultPicker({
        config: { minRuntimeVersion: '2.0' },
        fieldOverrides: { min_ai_gateway_version: '2.1' },
      })

      cy.getTestId('fake-vault-picker').should('have.attr', 'data-disabled', 'true')
    })

    it('leaves the vault picker enabled when there is no version lock', () => {
      mountWithVaultPicker({ config: { minRuntimeVersion: '2.1' }, fieldOverrides: { min_ai_gateway_version: '2.1' } })

      cy.getTestId('fake-vault-picker').should('have.attr', 'data-disabled', 'false')
    })
  })
})
