import { h } from 'vue'
import { Form } from '@kong-ui-public/freeform'
import ConfigForm from './ConfigForm.vue'

import type { FieldError, FormSchema, RevealOptions, RevealResult } from '@kong-ui-public/freeform'

// `host` is required, so it shows by default; `timeout` is optional, so it goes
// to the collapsed advanced section
const schema: FormSchema = {
  type: 'record',
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        { host: { type: 'string', required: true } },
        { timeout: { type: 'integer' } },
      ],
    },
  }],
}

const data = { config: { host: 'example.com', timeout: 1 } }

type FormApi = {
  reveal: (path: string, options?: RevealOptions) => Promise<RevealResult | null>
  unmatchedErrors: FieldError[]
}

function mountConfigForm(errors: FieldError[] = []) {
  let form: FormApi | undefined
  cy.mount(() => h(Form, { schema, data, errors, ref: (instance: unknown) => {
    form = instance as FormApi
  } }, {
    default: () => h(ConfigForm),
  }))
  return () => form!
}

describe('<ConfigForm />', () => {
  it('matches errors for fields in both the default and the advanced section', () => {
    const errors = [
      { path: 'config.host', message: 'invalid hostname' },
      { path: 'config.timeout', message: 'must be positive' },
    ]
    const form = mountConfigForm(errors)

    cy.getTestId('ff-field-errors-config.host').should('have.text', 'invalid hostname')
    cy.getTestId('ff-field-errors-config.timeout').should('exist')
    cy.then(() => form().unmatchedErrors).should('deep.equal', [])
  })

  it('opens the advanced section to reveal a field inside it', () => {
    const form = mountConfigForm()
    cy.getTestId('ff-config.timeout').should('not.be.visible')

    cy.then(() => form().reveal('config.timeout', { duration: 0 }))
      .should('deep.equal', { path: 'config.timeout', exact: true })
    cy.getTestId('ff-config.timeout').should('be.visible').and('have.focus')
  })

  it('leaves the advanced section collapsed for a default field', () => {
    const form = mountConfigForm()

    cy.then(() => form().reveal('config.host', { duration: 0 }))
      .should('deep.equal', { path: 'config.host', exact: true })
    cy.getTestId('ff-config.timeout').should('not.be.visible')
  })
})
