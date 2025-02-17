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
      styleClasses: 'awesome-cats',
      help: 'The name of the cat.',
      required: true,
    }],
  }
  const passwordSchema: FormSchema = {
    fields: [{
      type: 'input',
      model: fieldKey,
      id: fieldKey,
      inputType: 'password',
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
      cy.get('.required').find(`.form-group-label[for="${fieldKey}"]`).should('exist')
    } else {
      cy.get('.required').find(`.form-group-label[for="${fieldKey}"]`).should('not.exist')
    }

    // check help text
    if (schema.fields[0].help) {
      cy.get(`label[for="${fieldKey}"] .info-icon`).should('be.visible')
      cy.get(`label[for="${fieldKey}"]`).should('contain.text', schema.fields[0].help)
    }

    // check style classes
    if (schema.fields[0].styleClasses) {
      cy.get('.form-group.field-input').should('have.class', schema.fields[0].styleClasses)
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

  it('handles password field visibility toggle', () => {
    const editText = ' the Second'
    cy.mount(FieldTester, {
      props: {
        schema: passwordSchema,
        model: {
          [fieldKey]: fieldValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // check VFG input value and type
    cy.get(`#${fieldKey}`).should('be.visible')
    cy.get(`#${fieldKey}`).should('have.value', fieldValue).and('have.attr', 'type', 'password')
    cy.get('.mask-value-toggle-button').should('be.visible')

    // toggle visibility
    cy.get('.mask-value-toggle-button').click()
    cy.get(`#${fieldKey}`).should('have.value', fieldValue).and('have.attr', 'type', 'text')
    cy.get('.mask-value-toggle-button').should('be.visible')

    cy.get(`#${fieldKey}`).type(editText)
    cy.get(`#${fieldKey}`).should('have.value', fieldValue + editText)

    // check VFG input value and type after toggling back
    cy.get('.mask-value-toggle-button').click()
    cy.get(`#${fieldKey}`).should('have.value', fieldValue + editText).and('have.attr', 'type', 'password')
    cy.get('.mask-value-toggle-button').should('be.visible')
  })
})
