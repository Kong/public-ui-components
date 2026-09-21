import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldArray', () => {
  const fieldKey = 'issuers'

  // An array of objects whose item schema contains a field with a `visible`
  // function. `generateSchema` deep-clones the item schema via
  // JSON.parse(JSON.stringify(...)), which strips functions, so the clone must
  // explicitly restore them for conditional fields to keep working.
  const schema: FormSchema = {
    fields: [{
      type: 'array',
      model: fieldKey,
      id: fieldKey,
      label: 'Issuers',
      newElementButtonLabel: 'Add Issuer',
      items: {
        type: 'object',
        schema: {
          fields: [
            {
              id: 'verify_signature',
              model: 'verify_signature',
              type: 'checkbox',
              label: 'Verify Signature',
            },
            {
              id: 'jwks_uri',
              model: 'jwks_uri',
              type: 'input',
              inputType: 'text',
              label: 'JWKS URI',
              // conditionally visible based on the sibling field
              visible: (model: Record<string, any>) => model.verify_signature === true,
            },
          ],
        },
      },
    }],
  }

  it('preserves the `visible` function on item schema fields after cloning', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: [{ verify_signature: false, jwks_uri: '' }],
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // the controlling field renders with its index-suffixed id
    cy.get('#verify_signature-0').should('exist')

    // jwks_uri is hidden while verify_signature is false
    // (without the function-restoration fix it would always be visible)
    cy.get('#jwks_uri-0').should('not.exist')

    // toggling verify_signature should reveal jwks_uri, proving the `visible`
    // function survived the JSON clone
    cy.get('#verify_signature-0').click()
    cy.get('#jwks_uri-0').should('be.visible')

    // toggling back hides it again
    cy.get('#verify_signature-0').click()
    cy.get('#jwks_uri-0').should('not.exist')
  })

  it('applies the restored `visible` function to dynamically added items', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: [],
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // add a new item via the array's add button
    cy.getTestId(`add-${fieldKey}`).should('be.visible')
    cy.getTestId(`add-${fieldKey}`).click()

    // newly added item starts with verify_signature unchecked -> jwks_uri hidden
    cy.get('#verify_signature-0').should('exist')
    cy.get('#jwks_uri-0').should('not.exist')

    // the restored function works on the dynamically generated item too
    cy.get('#verify_signature-0').click()
    cy.get('#jwks_uri-0').should('be.visible')
  })

  it('evaluates the `visible` function independently per item', () => {
    cy.mount(FieldTester, {
      props: {
        schema,
        model: {
          [fieldKey]: [
            { verify_signature: true, jwks_uri: 'https://example.com/jwks' },
            { verify_signature: false, jwks_uri: '' },
          ],
        },
      },
    })

    cy.get('.field-tester-container').should('exist')

    // first item has verify_signature on -> jwks_uri shown
    cy.get('#jwks_uri-0').should('be.visible')
    // second item has verify_signature off -> jwks_uri hidden
    cy.get('#jwks_uri-1').should('not.exist')
  })
})
