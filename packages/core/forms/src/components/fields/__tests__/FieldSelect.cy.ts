import type { FormSchema } from '../../../types'
import FieldTester from '../../../../sandbox/FieldTester.vue'

describe('<FieldTester /> - FieldSwitch', () => {
  const fieldKeys = ['https_redirect_status_code', 'protocols']
  const fieldLabels = ['HTTPS Redirect Status Code', 'Protocols']
  const fieldValues = [307, 'http, https']
  const updatedValues = [426, 'https']
  const schema: FormSchema = {
    fields: [
      // with number[] and no groups
      {
        type: 'select',
        label: fieldLabels[0],
        id: fieldKeys[0],
        model: fieldKeys[0],
        name: fieldKeys[0],
        selectOptions: {
          hideNoneSelectedText: true,
        },
        values: [
          426,
          301,
          302,
          307,
          308,
        ],
        help: 'The status code Kong responds with when all properties of a Route match except the protocol i.e. if the protocol of the request is `HTTP` instead of `HTTPS`. `Location` header is injected by Kong if the field is set to 301, 302, 307 or 308. ',
      },
      // with object[] and groups
      {
        type: 'select',
        label: fieldLabels[1],
        name: fieldKeys[1],
        id: fieldKeys[1],
        model: fieldKeys[1],
        selectOptions: {
          hideNoneSelectedText: true,
        },
        required: true,
        values: [
          {
            name: 'grpc',
            id: [
              'grpc',
            ],
            group: 'grpc',
          },
          {
            name: 'grpcs',
            id: [
              'grpcs',
            ],
            group: 'grpc',
          },
          {
            name: 'grpc, grpcs',
            id: [
              'grpc',
              'grpcs',
            ],
            group: 'grpc',
          },
          {
            name: 'http',
            id: [
              'http',
            ],
            group: 'http',
            checked: true,
          },
          {
            name: 'https',
            id: [
              'https',
            ],
            group: 'http',
          },
          {
            name: 'http, https',
            id: [
              'http',
              'https',
            ],
            group: 'http',
          },
          {
            name: 'tcp',
            id: [
              'tcp',
            ],
            group: 'tcp',
          },
          {
            name: 'tls',
            id: [
              'tls',
            ],
            group: 'tcp',
          },
          {
            name: 'tcp, tls',
            id: [
              'tcp',
              'tls',
            ],
            group: 'tcp',
          },
          {
            name: 'udp',
            id: [
              'udp',
            ],
            group: 'udp',
          },
          {
            name: 'ws',
            id: [
              'ws',
            ],
            group: 'websocket',
            checked: true,
          },
          {
            name: 'wss',
            id: [
              'wss',
            ],
            group: 'websocket',
          },
          {
            name: 'ws, wss',
            id: [
              'ws',
              'wss',
            ],
            group: 'websocket',
          },
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
        cy.get(`.field-select.required label[for="${fieldKey}"]`).should('exist')
      } else {
        cy.get(`.field-select.required label[for="${fieldKey}"]`).should('not.exist')
      }

      // check all groups / options render
      cy.get(`#${fieldKey}`).click()

      const items = schema.fields[i].values
      items.forEach((item: Record<string, any> | string | number) => {
        if (typeof item === 'object') {
          if (item.group) {
            cy.get('.select-group-title').should('contain.text', String(item.group || '').toUpperCase())
            cy.get('.select-group').findTestId(`select-item-${item.name.replace(/ /g, '')}`).should('exist')
          } else {
            cy.getTestId(`select-item-${item.name}`).should('exist')
          }
        } else {
          cy.getTestId(`select-item-${item}`).should('exist')
        }
      })
    })

    it('renders default state correctly - with model', () => {
      const strippedVal = typeof fieldValue === 'number' ? fieldValue : String(fieldValue).replace(/ /g, '')
      cy.mount(FieldTester, {
        props: {
          schema,
          model: {
            [fieldKey]: strippedVal,
          },
        },
      })

      cy.get('.field-tester-container').should('exist')

      // check VFG input value
      cy.get(`#${fieldKey}`).should('exist')
      cy.get(`#${fieldKey}`).should('have.value', fieldValue)

      // check field test form model matches
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('be.visible')
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', strippedVal)
    })

    it('handles input changes', () => {
      const tVal = typeof updatedValue === 'number' ? String(updatedValue) : updatedValue
      cy.mount(FieldTester, {
        props: {
          schema,
        },
      })

      cy.get('.field-tester-container').should('exist')

      // edit the input value
      cy.get(`#${fieldKey}`).should('exist')
      cy.get(`#${fieldKey}`).click()
      cy.getTestId(`select-item-${tVal}`).should('exist')
      cy.getTestId(`select-item-${tVal}`).scrollIntoView()
      cy.getTestId(`select-item-${tVal}`).click()

      // check VFG input value
      cy.get(`#${fieldKey}`).should('have.value', updatedValue)
      // check field test form model
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedValue)
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
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', fieldValue)

      // programmatic update
      cy.getTestId('tester-update-button').should('be.visible')
      cy.getTestId('tester-update-button').click()

      // check VFG input value
      cy.get(`#${fieldKey}`).should('have.value', updatedValue)
      // check field test form model also matches
      cy.getTestId(`field-tester-form-model-${fieldKey}-value`).should('contain.text', updatedValue)
    })

    it('handles schema.selectOptions.hideNoneSelectedText', () => {
      schema.fields[i].selectOptions = {
        hideNoneSelectedText: false,
        noneSelectedText: 'why u no select bro?',
      }

      cy.mount(FieldTester, {
        props: {
          schema,
        },
      })

      cy.get('.field-tester-container').should('exist')

      // check VFG falsey label text
      cy.get(`#${fieldKey}`).should('have.value', '')
      cy.get(`#${fieldKey}`).should('have.attr', 'placeholder', schema.fields[i].selectOptions!.noneSelectedText)
    })
  }
})
