import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldRadio', () => {
  const fieldKey = 'gender'
  const fieldLabel = 'Gender'
  const fieldValue = 'male'
  const updatedFieldValue = 'not_specified'
  const schema: FormSchema = {
    fields: [{
      type: 'radio',
      model: fieldKey,
      id: fieldKey,
      name: fieldKey,
      label: fieldLabel,
      required: true,
      help: 'Specify a gender if it is known',
      styleClasses: 'cool-cats',
      values: [
        { name: 'Male', value: fieldValue },
        { name: 'Female', value: 'female' },
        { name: 'Not specified', value: updatedFieldValue },
      ],
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
    cy.get(`#${fieldKey}-0`).should('be.visible')
    cy.get(`#${fieldKey}-0`).should('not.be.checked')
    cy.get(`#${fieldKey}-1`).should('be.visible')
    cy.get(`#${fieldKey}-1`).should('not.be.checked')

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

    // check style classes
    if (schema.fields[0].styleClasses) {
      cy.get('.form-group.field-radio').should('have.class', schema.fields[0].styleClasses)
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
    cy.get(`#${fieldKey}-0`).should('be.visible')
    cy.get(`#${fieldKey}-0`).should('be.checked')

    // check field test form model matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)
  })

  it('handles input changes', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: fieldValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // edit the input value, by clicking second radio button
    cy.get(`#${fieldKey}-2`).should('be.visible')
    cy.get(`#${fieldKey}-2`).click()

    // check VFG input value
    cy.get(`#${fieldKey}-0`).should('not.be.checked')
    cy.get(`#${fieldKey}-2`).should('be.checked')
    // check field test form model
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedFieldValue)
  })

  it('handles programmatic input changes', () => {
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
    cy.get(`#${fieldKey}-0`).should('be.checked')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)

    // programmatic update
    cy.getTestId('tester-update-button').should('be.visible')
    cy.getTestId('tester-update-button').click()

    // check VFG input value
    cy.get(`#${fieldKey}-0`).should('not.be.checked')
    cy.get(`#${fieldKey}-2`).should('be.checked')
    // check field test form model also matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedFieldValue)
  })

  it('allows unsetting the model (set to null)', () => {
    const nullValue = null
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: fieldValue,
        },
        modifiedModel: {
          [fieldKey]: nullValue,
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // initial value loaded
    cy.get(`#${fieldKey}-0`).should('be.checked')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)

    // programmatic update
    cy.getTestId('tester-update-button').should('be.visible')
    cy.getTestId('tester-update-button').click()

    // check VFG input value
    cy.get(`#${fieldKey}-0`).should('not.be.checked')
    cy.get(`#${fieldKey}-2`).should('not.be.checked')
    // check field test form model also matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('not.contain.text', fieldValue)
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('not.contain.text', updatedFieldValue)
  })
})
