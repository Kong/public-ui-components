import { assertForm } from './utils'
import { buildMockingSchema } from '../../../../fixtures/schemas/free-form-mocking'
import Form from '../shared/Form.vue'

describe('Free Form', () => {
  it('Rendering structure', () => {
    const schema = buildMockingSchema()

    cy.mount(Form, {
      props: { schema },
    })

    assertForm(schema)
  })

  // it('Data binding', () => {})

  // it('Custom rendering', () => {})
})
