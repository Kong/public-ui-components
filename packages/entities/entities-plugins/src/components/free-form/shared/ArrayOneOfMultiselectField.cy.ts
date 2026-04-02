import Form from './Form.vue'
import FieldRenderer from './FieldRenderer.vue'
import ArrayOneOfMultiselectField from './ArrayOneOfMultiselectField.vue'
import { FIELD_RENDERERS } from './composables'
import type { FormSchema } from '../../../types/plugins/form-schema'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      methods: {
        type: 'array',
        elements: {
          type: 'string',
          one_of: [...HTTP_METHODS],
        },
        default: ['GET', 'POST'],
      },
    },
  ],
}

const mountWithField = (data?: object) => {
  cy.mount(Form, {
    props: {
      schema,
      data,
      onChange: cy.spy().as('onChange'),
    },
    slots: {
      [FIELD_RENDERERS]: `
        <FieldRenderer
          v-slot="slotProps"
          :match="({ path }) => path === 'methods'"
        >
          <ArrayOneOfMultiselectField v-bind="slotProps" />
        </FieldRenderer>`,
    },
    global: {
      components: { FieldRenderer, ArrayOneOfMultiselectField },
    },
  })
}

describe('<ArrayOneOfMultiselectField />', () => {
  it('should display schema default values as selected', () => {
    mountWithField()

    cy.get('[data-testid="ff-methods"]').should('contain.text', 'GET')
    cy.get('[data-testid="ff-methods"]').should('contain.text', 'POST')
  })

  it('should show all one_of options in the dropdown', () => {
    mountWithField()

    cy.get('[data-testid="ff-methods"]').click()

    HTTP_METHODS.forEach(method => {
      cy.get(`[data-testid="multiselect-item-${method}"]`).should('exist')
    })
  })

  it('should keep the value as an array in the form data', () => {
    mountWithField({ methods: ['GET', 'POST'] })

    cy.get('@onChange').should('have.been.calledWith', { methods: ['GET', 'POST'] })
  })

  it('should add an item to the array when selected in the dropdown', () => {
    mountWithField({ methods: ['GET'] })

    cy.get('[data-testid="ff-methods"]').click()
    cy.get('[data-testid="multiselect-item-PUT"]').click()

    cy.get('@onChange').then((spy: any) => {
      const lastArg = spy.lastCall.args[0]
      expect(lastArg.methods).to.include('GET')
      expect(lastArg.methods).to.include('PUT')
    })
  })

  it('should remove an item from the array when deselected in the dropdown', () => {
    mountWithField({ methods: ['GET', 'POST'] })

    cy.get('[data-testid="ff-methods"]').click()
    // GET is already selected — clicking it again deselects it
    cy.get('[data-testid="multiselect-item-GET"]').click()

    cy.get('@onChange').then((spy: any) => {
      const lastArg = spy.lastCall.args[0]
      expect(lastArg.methods).to.deep.equal(['POST'])
    })
  })
})
