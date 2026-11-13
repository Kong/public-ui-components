import Form from './Form.vue'
import type { FormSchema } from '../form-schema'

const schema: FormSchema = {
  type: 'record',
  fields: [
    {
      limits: {
        type: 'record',
        required: true,
        entity_checks: [
          { at_least_one_of: ['second', 'redis.host'] },
        ],
        fields: [
          { second: { type: 'integer' } },
          {
            redis: {
              type: 'record',
              fields: [{ host: { type: 'string' } }],
            },
          },
        ],
      },
    },
  ],
}

const data = { limits: { second: null, redis: { host: 'localhost' } } }

describe('EntityChecksAlert links', () => {
  it('reveals the field a check names', () => {
    cy.mount(Form, { props: { schema, data } })

    cy.getTestId('ff-entity-check-field-second').click()
    cy.getTestId('ff-limits.second').should('have.focus')
  })

  it('reveals a nested field, expanding its collapsed record on the way', () => {
    cy.mount(Form, { props: { schema, data } })
    cy.getTestId('ff-object-toggle-btn-limits.redis').click()
    cy.getTestId('ff-limits.redis.host').should('not.exist')

    cy.getTestId('ff-entity-check-field-redis.host').should('have.text', 'Redis › Host').click()
    cy.getTestId('ff-limits.redis.host').should('be.visible').and('have.focus')
  })
})

describe('EntityChecksAlert links inside a map entry', () => {
  const mapSchema: FormSchema = {
    type: 'record',
    fields: [{
      providers: {
        type: 'map',
        keys: { type: 'string' },
        values: {
          type: 'record',
          entity_checks: [{ at_least_one_of: ['model', 'options.temperature'] }],
          fields: [
            { model: { type: 'string' } },
            { options: { type: 'record', fields: [{ temperature: { type: 'number' } }] } },
          ],
        },
      },
    }],
  }

  it('reveals a field of the entry, whose key has a dot in it', () => {
    // The record's path holds a key ID, which the link turns back into `"azure.openai"`
    cy.mount(Form, { props: { schema: mapSchema, data: { providers: { 'azure.openai': { model: 'gpt-4o', options: { temperature: 0.7 } } } } } })

    cy.getTestId('ff-entity-check-field-options.temperature').click()
    cy.focused().should('have.value', '0.7')
  })
})
