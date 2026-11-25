import { h } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import type { FormSchema, FormConfig, FieldError } from '@kong-ui-public/freeform'
import ScopeEntityField from './ScopeEntityField.vue'
import { FORMS_API_KEY } from '../const'

const FIELD_NAME = 'service'
const ENTITY_ID = 'svc-1'
const ENTITY_ITEM = { id: ENTITY_ID, name: 'Service One' }

function createForeignSchema(): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: { type: 'foreign', reference: 'services' },
    }],
  } as FormSchema
}

function createFakeApi() {
  return {
    peek: () => Promise.resolve({ data: { data: [ENTITY_ITEM], next: null, offset: null } }),
    getAllV2: () => Promise.resolve({ data: { data: [ENTITY_ITEM] } }),
    getOne: () => Promise.resolve({ status: 200, data: ENTITY_ITEM }),
  }
}

function mountScopeEntityForm(options: {
  data?: Record<string, unknown>
  config?: FormConfig
  errors?: FieldError[]
}) {
  const props = {
    schema: createForeignSchema(),
    data: options.data,
    config: options.config,
    errors: options.errors,
    onChange: cy.spy().as('onChangeSpy'),
  }

  cy.mount(() => h(Form, props, {
    default: () => h(ScopeEntityField, { name: FIELD_NAME, entity: 'services' }),
  }), {
    global: {
      provide: {
        [FORMS_API_KEY]: createFakeApi(),
      },
    },
  })
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

describe('ScopeEntityField', () => {
  it('should emit null when clearing a selected entity (default behavior)', () => {
    mountScopeEntityForm({
      data: { [FIELD_NAME]: { id: ENTITY_ID } },
    })

    cy.getTestId('clear-selection-icon').click()

    assertLastChange({ [FIELD_NAME]: null })
  })

  describe('emptyFieldValue config', () => {
    it('should emit undefined when clearing a selected entity with emptyFieldValue: undefined', () => {
      mountScopeEntityForm({
        data: { [FIELD_NAME]: { id: ENTITY_ID } },
        config: { emptyFieldValue: 'undefined' },
      })

      cy.getTestId('clear-selection-icon').click()

      assertLastChange({ [FIELD_NAME]: undefined })
    })
  })

  describe('field errors', () => {
    for (const path of [FIELD_NAME, `${FIELD_NAME}.id`]) {
      it(`should show an error at ${path} on the select`, () => {
        mountScopeEntityForm({
          data: { [FIELD_NAME]: { id: ENTITY_ID } },
          errors: [{ path, message: 'service not found' }],
        })

        cy.getTestId(`ff-${FIELD_NAME}`).find('.help-text').should('have.text', 'service not found')
      })
    }

    it('should show no error when the field has none', () => {
      mountScopeEntityForm({
        data: { [FIELD_NAME]: { id: ENTITY_ID } },
        errors: [],
      })

      cy.getTestId(`ff-${FIELD_NAME}`).find('.help-text').should('not.exist')
    })
  })
})
