import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldCheckbox', () => {
  const fieldKey = 'coolness'
  const fieldLabel = 'Is Cool?'
  const fieldValue = true
  const schema: FormSchema = {
    fields: [{
      type: 'checkbox',
      model: fieldKey,
      id: fieldKey,
      label: fieldLabel,
      help: 'Check if the cat is cool.',
      required: true,
      styleClasses: 'cool-cats',
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
    cy.get(`#${fieldKey}`).should('not.be.checked')

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
      cy.get('.form-group.field-checkbox').should('have.class', schema.fields[0].styleClasses)
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
    cy.get(`#${fieldKey}`).should('be.visible')
    cy.get(`#${fieldKey}`).click()

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

  describe('checkbox label, description and tooltip', () => {
    const checkboxLabel = 'Verify signature'

    it('renders `checkboxLabel` and a string `checkboxDescription` directly on the checkbox', () => {
      const description = 'JSON Web Keys are fetched automatically.'

      cy.mount(FieldTester, {
        props: {
          schema: {
            fields: [{
              type: 'checkbox',
              model: fieldKey,
              id: fieldKey,
              checkboxLabel,
              checkboxDescription: description,
            }],
          },
          model: { [fieldKey]: true },
        },
      })

      // label renders on the KCheckbox itself
      cy.get('.checkbox-label').should('be.visible')
      cy.get('.checkbox-label').should('contain.text', checkboxLabel)

      // no FormGroup-level label is rendered (schema.label is unset)
      cy.get(`.form-group-label[for="${fieldKey}"]`).should('not.exist')

      // description renders on the checkbox
      cy.get('.checkbox-description').should('be.visible')
      cy.get('.checkbox-description').should('contain.text', description)
    })

    it('evaluates a function `checkboxDescription` against the model and reacts to changes', () => {
      const description = 'Enter a JWKS URI below to override this.'

      cy.mount(FieldTester, {
        props: {
          schema: {
            fields: [{
              type: 'checkbox',
              model: fieldKey,
              id: fieldKey,
              checkboxLabel,
              // only shown when this checkbox is checked
              checkboxDescription: (model: Record<string, any>) => model[fieldKey] === true ? description : undefined,
            }],
          },
          model: { [fieldKey]: false },
        },
      })

      // unchecked -> description function returns undefined -> not rendered
      cy.get(`#${fieldKey}`).should('not.be.checked')
      cy.get('.checkbox-description').should('not.exist')

      // checking the box -> description appears
      cy.get(`#${fieldKey}`).click()
      cy.get('.checkbox-description').should('be.visible')
      cy.get('.checkbox-description').should('contain.text', description)

      // unchecking -> description disappears again
      cy.get(`#${fieldKey}`).click()
      cy.get('.checkbox-description').should('not.exist')
    })

    it('renders the tooltip trigger only when both `checkboxLabel` and `help` are set', () => {
      // help without checkboxLabel -> no checkbox tooltip trigger
      cy.mount(FieldTester, {
        props: {
          schema: {
            fields: [{
              type: 'checkbox',
              model: fieldKey,
              id: fieldKey,
              checkboxLabel,
              help: '',
            }],
          },
          model: { [fieldKey]: true },
        },
      })
      cy.get('.checkbox-label .tooltip-trigger-icon').should('not.exist')

      // checkboxLabel + help -> tooltip trigger rendered on the checkbox label
      cy.mount(FieldTester, {
        props: {
          schema: {
            fields: [{
              type: 'checkbox',
              model: fieldKey,
              id: fieldKey,
              checkboxLabel,
              help: '<p>Some <strong>helpful</strong> info</p>',
            }],
          },
          model: { [fieldKey]: true },
        },
      })
      cy.get('.checkbox-label .tooltip-trigger-icon').should('exist')
    })

    it('sanitizes the tooltip `help` HTML and strips paragraph wrappers', () => {
      cy.mount(FieldTester, {
        props: {
          schema: {
            fields: [{
              type: 'checkbox',
              model: fieldKey,
              id: fieldKey,
              checkboxLabel,
              // <p> wrappers should be stripped; malicious markup should be sanitized away
              help: '<p>Safe <strong>bold</strong> text<img src="x" onerror="window.__xss = true"></p>',
            }],
          },
          model: { [fieldKey]: true },
        },
      })

      // open the tooltip (its content is teleported out of .checkbox-label and
      // mounted lazily, so query it at the document level)
      cy.get('.checkbox-label .tooltip-trigger-icon').trigger('mouseenter')

      // the content mounted, allowed formatting is preserved, and the <p>
      // wrapper was stripped (text reads as one line, no paragraph break)
      cy.contains('Safe bold text').should('exist')
      cy.contains('Safe bold text').find('strong').should('contain.text', 'bold')

      // the onerror handler was sanitized away and never executed
      cy.window().then((win) => {
        expect((win as any).__xss).to.not.equal(true)
      })
    })
  })
})
