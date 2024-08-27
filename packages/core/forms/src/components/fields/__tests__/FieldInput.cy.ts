import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldInput', () => {
  const fieldKey = 'cat_name'
  const fieldLabel = 'Cat Name'
  const fieldValue = 'TK Meowstersmith'
  const schema: FormSchema = {
    fields: [{
      type: 'input',
      model: fieldKey,
      id: fieldKey,
      inputType: 'text',
      label: fieldLabel,
      help: 'The name of the cat.',
      required: true,
    }],
  }

  it('renders default state correctly - without model', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
      },
    })

    cy.get('.field-tester-container').should('exist')

    // check VFG input value
    cy.get(`#${fieldKey}`).should('be.visible')
    cy.get(`#${fieldKey}`).should('have.value', '')

    // initial model is empty after load
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('not.exist')

    // check VFG label is set correctly
    cy.get(`.form-group-label[for="${fieldKey}"]`).should('be.visible')
    cy.get(`.form-group-label[for="${fieldKey}"]`).should('contain.text', fieldLabel)

    // check required state
    if (schema.fields[0].required) {
      cy.get(`.field-select.required label[for="${fieldKey}"]`).should('exist')
    } else {
      cy.get(`.field-select.required label[for="${fieldKey}"]`).should('not.exist')
    }

    // check help text
    if (schema.fields[0].help) {
      cy.get(`label[for="${fieldKey}"] .info-icon`).should('be.visible')
      cy.get(`label[for="${fieldKey}"]`).should('contain.text', schema.fields[0].help)
    }
  })

  it('renders default state correctly - with model', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: fieldValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // check VFG input value
    cy.get(`#${fieldKey}`).should('be.visible')
    cy.get(`#${fieldKey}`).should('have.value', fieldValue)

    // check field test form model matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)
  })

  it('handles input changes', () => {
    const editText = ' the Second'
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: fieldValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // edit the input value
    cy.get(`#${fieldKey}`).should('be.visible')
    cy.get(`#${fieldKey}`).type(editText)

    // check VFG input value
    cy.get(`#${fieldKey}`).should('have.value', fieldValue + editText)
    // check field test form model
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue + editText)
  })

  it('handles programmatic input changes', () => {
    const updatedFieldValue = 'TK Meowstersmith Jr.'

    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: fieldValue,
        },
        modifiedModel: {
          [fieldKey]: updatedFieldValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // initial value loaded
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)

    // programmatic update
    cy.getTestId('tester-update-button').should('be.visible')
    cy.getTestId('tester-update-button').click()

    // check VFG input value
    cy.get(`#${fieldKey}`).should('have.value', updatedFieldValue)
    // check field test form model also matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedFieldValue)
  })
})
