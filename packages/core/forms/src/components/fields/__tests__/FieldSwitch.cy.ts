import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldSwitch', () => {
  const fieldKey = 'is_cute'
  const fieldLabel = 'Is this cat cute?'
  const fieldValue = true
  const schema: FormSchema = {
    fields: [{
      type: 'switch',
      model: fieldKey,
      id: fieldKey,
      inputType: 'text',
      label: fieldLabel,
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
    cy.get(`#${fieldKey}`).should('exist')
    cy.get(`#${fieldKey}`).should('not.be.checked')

    // initial model is empty after load
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('not.exist')

    // check VFG label is set correctly
    cy.get(`.form-group-label[for="${fieldKey}"]`).should('be.visible')
    cy.get(`.form-group-label[for="${fieldKey}"]`).should('contain.text', fieldLabel)

    // check required state
    if (schema.fields[0].required) {
      cy.get(`.form-group-label.required[for="${fieldKey}"]`).should('exist')
    } else {
      cy.get(`.form-group-label.required[for="${fieldKey}"]`).should('not.exist')
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
    cy.get(`#${fieldKey}`).should('exist')
    cy.get(`#${fieldKey}`).should('be.checked')

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

    // edit the input value
    cy.get(`#${fieldKey}`).should('exist')
    // actual input is always hidden for KInputSwitch
    cy.get(`#${fieldKey}`).click({ force: true })

    // check VFG input value
    cy.get(`#${fieldKey}`).should('not.be.checked')
    // check field test form model
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', 'false')
  })

  it('handles programmatic input changes', () => {
    const updatedFieldValue = false

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
    cy.get(`#${fieldKey}`).should('not.be.checked')
    // check field test form model also matches
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedFieldValue)
  })

  it('handles schema.textOn and schema.textOff', () => {
    schema.fields[0].textOn = 'Sure is!'
    schema.fields[0].textOff = 'Nope!'

    cy.mount(FieldTester, {
      props: {
        schema,
      },
    })

    cy.get('.field-tester-container').should('exist')

    // check VFG falsey label text
    cy.get(`#${fieldKey}`).should('not.be.checked')
    cy.get('.k-input-switch .k-label').should('contain.text', schema.fields[0].textOff)

    // actual input is always hidden for KInputSwitch
    cy.get(`#${fieldKey}`).click({ force: true })

    // check VFG truthy label text
    cy.get(`#${fieldKey}`).should('be.checked')
    cy.get('.k-input-switch .k-label').should('contain.text', schema.fields[0].textOn)
  })

  it('handles schema.valueOn and schema.valueOff', () => {
    schema.fields[0].valueOn = 'yes'
    schema.fields[0].valueOff = 'no'

    cy.mount(FieldTester, {
      props: {
        schema,
      },
    })

    cy.get('.field-tester-container').should('exist')

    // actual input is always hidden for KInputSwitch
    cy.get(`#${fieldKey}`).click({ force: true })

    // check VFG truthy model value
    cy.get(`#${fieldKey}`).should('be.checked')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', schema.fields[0].valueOn)

    // actual input is always hidden for KInputSwitch
    cy.get(`#${fieldKey}`).click({ force: true })

    // check VFG falsey model value
    cy.get(`#${fieldKey}`).should('not.be.checked')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
    cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', schema.fields[0].valueOff)
  })
})
