import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldMultiselect', () => {
  const fieldKeys = ['https_redirect_status_code', 'protocols']
  const fieldLabels = ['HTTPS Redirect Status Code', 'Protocols']
  const fieldValues = [['400'], ['https']]
  const updatedValues = [['426'], ['tls', 'ws']]
  const styleClasses = ['', 'plugin-protocols-select']

  const schema: FormSchema = {
    fields: [
      // with elements.one_of
      {
        type: 'multiselect',
        label: fieldLabels[0],
        id: fieldKeys[0],
        model: fieldKeys[0],
        name: fieldKeys[0],
        elements: {
          one_of: [
            301,
            302,
            307,
            308,
            400,
            426,
          ],
        },
        help: 'The status code Kong responds with when all properties of a Route match except the protocol i.e. if the protocol of the request is `HTTP` instead of `HTTPS`. `Location` header is injected by Kong if the field is set to 301, 302, 307 or 308. ',
      },
      // with values
      {
        type: 'multiselect',
        label: fieldLabels[1],
        id: fieldKeys[1],
        model: fieldKeys[1],
        name: fieldKeys[1],
        required: true,
        styleClasses: styleClasses[1],
        values: [
          { label: 'GRPC', value: 'grpc' },
          { label: 'GRPCS', value: 'grpcs' },
          { label: 'HTTP', value: 'http' },
          { label: 'HTTPS', value: 'https' },
          { label: 'TCP', value: 'tcp' },
          { label: 'TLS', value: 'tls' },
          { label: 'TLS_PASSTHROUGH', value: 'tls_passthrough' },
          { label: 'UDP', value: 'udp' },
          { label: 'WS', value: 'ws' },
          { label: 'WSS', value: 'wss' },
        ],
        help: 'An array of the protocols this Route should allow. See the [Route Object](#route-object) section for a list of accepted protocols. When set to only `"https"`, HTTP requests are answered with an upgrade error. When set to only `"http"`, HTTPS requests are answered with an error. ',
      }],
  }

  for (let i = 0; i < fieldKeys.length; i++) {
    const fieldKey = fieldKeys[i]
    const fieldLabel = fieldLabels[i]
    const fieldValue = fieldValues[i]
    const updatedValue = updatedValues[i]

    it('renders default state correctly - without model', () => {
      cy.mount(FieldTester, {
        props: {
          schema,
        },
      })

      cy.get('.field-tester-container').should('exist')

      // check VFG input value
      cy.get(`#${fieldKey}`).should('exist')
      cy.get(`#${fieldKey}`).should('have.value', '')

      // initial model is empty after load
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('not.exist')

      // check VFG label is set correctly
      cy.get(`.form-group-label[for="${fieldKey}"]`).should('be.visible')
      cy.get(`.form-group-label[for="${fieldKey}"]`).should('contain.text', fieldLabel)

      // check help text
      if (schema.fields[i].help) {
        cy.get(`label[for="${fieldKey}"] .info-icon`).should('be.visible')
        cy.get(`label[for="${fieldKey}"]`).should('contain.text', schema.fields[i].help)
      }

      // check required state
      if (schema.fields[i].required) {
        cy.get(`.field-multiselect.required label[for="${fieldKey}"]`).should('exist')
      } else {
        cy.get(`.field-multiselect.required label[for="${fieldKey}"]`).should('not.exist')
      }

      // check style classes
      if (schema.fields[i].styleClasses) {
        cy.get('.form-group.field-multiselect').should('have.class', styleClasses[i])
      }

      // check all options render
      cy.get(`#${fieldKey}`).click()

      const items = schema.fields[i].elements?.one_of || schema.fields[i].values
      items.forEach((item: Record<string, any> | string) => {
        if (typeof item === 'object') {
          cy.getTestId(`multiselect-item-${item.value}`).should('exist')
        } else {
          cy.getTestId(`multiselect-item-${item}`).should('exist')
        }
      })
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

      cy.get(`#${fieldKey}`).should('exist')
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')

      // check VFG input value
      // check field test form model matches
      for (let j = 0; j < fieldValue.length; j++) {
        // label is to uppercase of value
        cy.get(`[data-testid="${fieldKey}-items"] [data-testid="selection-badges-container"] .badge-content-wrapper`).should('contain.text', fieldValue[j].toUpperCase())
        cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue[j])
      }
    })

    it('handles input changes', () => {
      cy.mount(FieldTester, {
        props: {
          schema,
        },
      })

      cy.get('.field-tester-container').should('exist')

      // edit the input value
      cy.get(`#${fieldKey}`).should('exist')
      cy.get(`#${fieldKey}`).click()
      for (let j = 0; j < updatedValue.length; j++) {
        cy.getTestId(`multiselect-item-${updatedValue[j]}`).find('button').should('exist')
        cy.getTestId(`multiselect-item-${updatedValue[j]}`).find('button').scrollIntoView()
        cy.getTestId(`multiselect-item-${updatedValue[j]}`).find('button').should('be.visible')
        cy.getTestId(`multiselect-item-${updatedValue[j]}`).find('button').click()
      }

      for (let j = 0; j < updatedValue.length; j++) {
        // check VFG input value - label is to uppercase of value
        cy.get(`[data-testid="${fieldKey}-items"] [data-testid="selection-badges-container"] .badge-content-wrapper`).should('contain.text', updatedValue[j].toUpperCase())
        // check field test form model
        cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedValue[j])
      }
    })

    it('handles programmatic input changes', () => {
      cy.mount(FieldTester, {
        props: {
          schema,
          model: {
            [fieldKey]: fieldValue,
          },
          modifiedModel: {
            [fieldKey]: updatedValue,
          },
        },
      })

      cy.get('.field-tester-container').should('exist')

      // initial value loaded
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
      for (let j = 0; j < fieldValue.length; j++) {
        cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue[j])
      }

      // programmatic update
      cy.getTestId('tester-update-button').should('be.visible')
      cy.getTestId('tester-update-button').click()

      for (let j = 0; j < updatedValue.length; j++) {
        // check VFG input value - label is to uppercase of value
        cy.get(`[data-testid="${fieldKey}-items"] [data-testid="selection-badges-container"] .badge-content-wrapper`).should('contain.text', updatedValue[j].toUpperCase())
        // check field test form model also matches
        cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedValue[j])
      }
    })
  }
})
