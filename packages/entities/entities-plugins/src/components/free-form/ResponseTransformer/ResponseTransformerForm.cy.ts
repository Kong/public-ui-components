import ResponseTransformerForm from './ResponseTransformerForm.vue'

describe('<ResponseTransformerForm />', () => {
  const mountForm = (model: object) => {
    cy.mount(ResponseTransformerForm as any, {
      props: {
        schema: {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  {
                    replace: {
                      type: 'record',
                      fields: [
                        { body: { type: 'string' } },
                        { json: { type: 'array', elements: { type: 'string' } } },
                      ],
                    },
                  },
                  {
                    transform: {
                      type: 'record',
                      fields: [
                        { functions: { type: 'array', elements: { type: 'string' } } },
                      ],
                    },
                  },
                  {
                    add: {
                      type: 'record',
                      fields: [
                        { json: { type: 'array', elements: { type: 'string' } } },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        formSchema: { fields: [] },
        model,
        formModel: {},
        isEditing: false,
        onFormChange: cy.spy().as('onFormChange'),
        pluginName: 'response-transformer',
      },
    })
  }

  it('should render config.replace.body as textarea', () => {
    mountForm({ config: { replace: { body: 'test body' } } })

    cy.getTestId('ff-config.replace.body').should('match', 'textarea')
  })

  it('should render config.transform.functions items as textarea', () => {
    mountForm({ config: { transform: { functions: ['test function'] } } })

    cy.getTestId('ff-config.transform.functions.0').should('match', 'textarea')
  })

  it('should render config.*.json array items as textarea', () => {
    mountForm({
      config: {
        replace: { json: ['replace-json'] },
        add: { json: ['add-json'] },
      },
    })

    cy.getTestId('ff-config.replace.json.0').should('match', 'textarea')
    cy.getTestId('ff-config.add.json.0').should('match', 'textarea')
  })
})
