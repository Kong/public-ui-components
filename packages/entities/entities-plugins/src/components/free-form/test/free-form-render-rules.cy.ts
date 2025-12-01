import Form from '../shared/Form.vue'
import type { FormSchema } from '../../../types/plugins/form-schema'
import type { RenderRules } from '../shared/types'

const fieldPrefix = 'field'
const getFieldName = (name?: string) => {
  if (!name) return fieldPrefix
  if (name.includes('.')) {
    const parts = name.split('.')
    const last = parts.pop()
    return [...parts, `${fieldPrefix}_${last}`].join('.')
  }
  return `${fieldPrefix}_${name}`
}
const getFieldTestId = (name?: string) => `ff-${name}`

// Helper function to create a simple field schema
const createField = (name: string) => ({ [getFieldName(name)]: { type: 'string' as const } })

// Helper function to create a schema with multiple fields
const createSchema = (...fieldNames: string[]): FormSchema => ({
  type: 'record',
  fields: fieldNames.map(createField),
})

// Helper function to create render rules with bundles
const createBundles = (...bundles: string[][]): RenderRules['bundles'] => bundles.map(bundle => bundle.map(name => getFieldName(name)))

// Helper function to filter visible elements (not affected by CSS animations)
const filterVisibleElements = (elements: HTMLElement[]) => {
  return elements.filter(el => {
    // offsetParent is null when element or any ancestor has display:none
    return el.offsetParent !== null
  })
}

// Helper function to verify field rendering order
const verifyFieldOrder = (expectedOrder: string[], prefix?: string) => {
  const fieldPrefix = prefix ? `${prefix}.` : ''
  cy.get(`[data-testid^="${getFieldTestId(`${fieldPrefix}${getFieldName()}`)}"]`).then(($fields) => {
    const visibleFields = filterVisibleElements($fields.toArray())
    const actualOrder = visibleFields.map(el => el.getAttribute('data-testid'))
    expect(actualOrder).to.deep.equal(expectedOrder.map(name => getFieldTestId(`${fieldPrefix}${getFieldName(name)}`)))
  })
}

// Helper function to verify all fields exist
const verifyFieldsExist = (...fieldNames: string[]) => {
  fieldNames.forEach(name => {
    cy.getTestId(getFieldTestId(getFieldName(name))).should('exist')
  })
}

describe('Render Rules', () => {
  describe('Bundles', () => {
    describe('Basic bundle functionality', () => {
      it('should reorder fields with a single bundle', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        const renderRules: RenderRules = {
          bundles: createBundles(['c', 'b']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldsExist('a', 'b', 'c', 'd')
        verifyFieldOrder(['a', 'c', 'b', 'd'])
      })

      it('should apply multiple bundles simultaneously', () => {
        const schema = createSchema('a', 'b', 'c', 'd', 'e')

        const renderRules: RenderRules = {
          bundles: createBundles(['d', 'a'], ['c', 'b']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldOrder(['c', 'b', 'd', 'a', 'e'])
      })

      it('should handle transitive dependencies with cascading triggers', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        const renderRules: RenderRules = {
          bundles: createBundles(['c', 'b'], ['b', 'a']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldOrder(['c', 'b', 'a', 'd'])
      })

      it('should maintain original order for non-bundled fields', () => {
        const schema = createSchema('a', 'b', 'c', 'd', 'e', 'f')

        const renderRules: RenderRules = {
          bundles: createBundles(['a', 'b'], ['e', 'f']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldOrder(['a', 'b', 'c', 'd', 'e', 'f'])
      })
    })

    describe('Bundle edge cases', () => {
      it('should handle bundle references to non-existent fields gracefully', () => {
        const schema = createSchema('a', 'b', 'c')

        const renderRules: RenderRules = {
          bundles: createBundles(['x', 'b']), // x doesn't exist
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldOrder(['a', 'b', 'c'])
      })

      it('should not affect rendering when bundles array is empty', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        const renderRules: RenderRules = {
          bundles: [],
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        verifyFieldOrder(['a', 'b', 'c', 'd'])
      })
    })

    describe('Nested bundle scenarios', () => {
      it('should apply bundles to fields within ObjectField', () => {
        const schema: FormSchema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: createSchema('x', 'y', 'z').fields,
              },
            },
          ],
        }

        const renderRules: RenderRules = {
          bundles: createBundles(['config.z', 'config.x']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        cy.getTestId('ff-object-add-btn-config').should('exist')
        cy.getTestId('ff-object-add-btn-config').click()

        // Verify order within config object
        cy.getTestId('ff-object-config').within(() => {
          verifyFieldOrder(['y', 'z', 'x'], 'config')
        })

      })

      it('should support independent bundles at different nesting levels', () => {
        const schema: FormSchema = {
          type: 'record',
          fields: [
            { field_a: { type: 'string' } },
            { field_b: { type: 'string' } },
            {
              config: {
                type: 'record',
                fields: createSchema('x', 'y').fields,
              },
            },
          ],
        }

        const renderRules: RenderRules = {
          bundles: createBundles(['field_b', 'field_a'], ['config.y', 'config.x']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Verify root level order: field_b, field_a
        cy.getTestId('ff-field_b').should('exist')
        cy.getTestId('ff-field_a').should('exist')

        // Add config object
        cy.getTestId('ff-object-add-btn-config').should('exist')
        cy.getTestId('ff-object-add-btn-config').click()

        // Verify nested level order: y, x within config
        cy.getTestId('ff-object-config').within(() => {
          verifyFieldOrder(['y', 'x'], 'config')
        })
      })
    })

    describe('Bundle validation errors', () => {
      it('should report error when bundle contains less than 2 fields', () => {
        const schema = createSchema('a', 'b', 'c')

        const renderRules: RenderRules = {
          bundles: createBundles(['a']), // Only one field
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Fields should render in original order despite error
        verifyFieldOrder(['a', 'b', 'c'])

        // TODO: Verify console error message when validation is implemented
      })

      it('should handle circular bundle references without infinite loops', () => {
        const schema = createSchema('a', 'b', 'c')

        const renderRules: RenderRules = {
          bundles: createBundles(['a', 'b'], ['b', 'a']),
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Should render without hanging
        verifyFieldsExist('a', 'b', 'c')
      })
    })
  })

  describe('Dependencies', () => {
    describe('Basic dependency functionality', () => {
      it('should show or hide field based on string value dependency', () => {
        const schema = createSchema('a', 'b', 'c')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Initially field_b should be hidden (field_a has no value)
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')

        // Set field_a to 'show'
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('show')

        // Now field_b should be visible
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')

        // Change field_a to something else
        cy.getTestId(getFieldTestId(getFieldName('a'))).clear()
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('hide')

        // field_b should be hidden again
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')
      })

      it('should support object value dependency with deep equality comparison', () => {
        const schema: FormSchema = {
          type: 'record',
          fields: [
            {
              strategy: {
                type: 'record',
                fields: [
                  { type: { type: 'string' } },
                ],
              },
            },
            { redis_config: { type: 'string' } },
          ],
        }

        const renderRules: RenderRules = {
          dependencies: {
            redis_config: ['strategy', { type: 'redis' }],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // redis_config should be hidden initially
        cy.getTestId('ff-redis_config').should('not.be.visible')

        // TODO: Test with actual object value setting when form supports it
      })

      it('should support null or undefined value dependencies', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), null],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // field_b should be visible when field_a is null/undefined
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')

        // Set field_a to a value
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('value')

        // field_b should be hidden
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')
      })
    })

    describe('Dependency value cleanup', () => {
      it('should clear field value when dependency is not satisfied', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show'],
          },
        }

        const onChangeSpy = cy.spy().as('onChangeSpy')

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
            modelValue: {},
            onChange: onChangeSpy,
          },
        })

        // Set field_a to 'show' to make field_b visible
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('show')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')

        // Enter value in field_b
        cy.getTestId(getFieldTestId(getFieldName('b'))).type('test_value')

        // Verify onChange was called with field_b value set
        cy.get('@onChangeSpy').should('have.been.calledWith', Cypress.sinon.match((value: any) => {
          return value[getFieldName('b')] === 'test_value'
        }))

        // Change field_a to hide field_b
        cy.getTestId(getFieldTestId(getFieldName('a'))).clear()
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('hide')

        // field_b should be hidden
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')

        // Verify that field_b value is cleared from formData
        cy.get('@onChangeSpy').should('have.been.calledWith', Cypress.sinon.match((value: any) => {
          return value[getFieldName('b')] === null
        }))
      })

      it('should restore previous value when dependency is satisfied again', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Show field_b and enter value
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('show')
        cy.getTestId(getFieldTestId(getFieldName('b'))).type('test_value')

        // Hide field_b
        cy.getTestId(getFieldTestId(getFieldName('a'))).clear()
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('hide')

        // Show field_b again
        cy.getTestId(getFieldTestId(getFieldName('a'))).clear()
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('show')

        // field_b should be test_value, value restored
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('have.value', 'test_value')
      })
    })

    describe('Nested dependency scenarios', () => {
      it('should support dependencies within nested objects', () => {
        // Test case 2.3.1: Nested object dependencies
        const schema: FormSchema = {
          type: 'record',
          fields: [
            {
              config: {
                type: 'record',
                fields: [
                  { field_strategy: { type: 'string' } },
                  { field_redis: { type: 'string' } },
                  { field_other: { type: 'string' } },
                ],
              },
            },
          ],
        }

        const renderRules: RenderRules = {
          dependencies: {
            'config.field_redis': ['config.field_strategy', 'redis'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Add config object
        cy.getTestId('ff-object-add-btn-config').should('exist').should('be.visible')
        cy.getTestId('ff-object-add-btn-config').click()

        // Initially field_redis should be hidden (field_strategy has no value)
        cy.getTestId('ff-config.field_strategy').should('exist').should('be.visible')
        cy.getTestId('ff-config.field_redis').should('not.be.visible')
        cy.getTestId('ff-config.field_other').should('exist').should('be.visible')

        // Set field_strategy to 'redis'
        cy.getTestId('ff-config.field_strategy').type('redis')

        // Now field_redis should be visible
        cy.getTestId('ff-config.field_redis').should('exist').should('be.visible')

        // Change field_strategy to something else
        cy.getTestId('ff-config.field_strategy').clear()
        cy.getTestId('ff-config.field_strategy').type('local')

        // field_redis should be hidden again
        cy.getTestId('ff-config.field_redis').should('not.be.visible')
      })

      it('should support chained dependencies', () => {
        const schema = createSchema('a', 'b', 'c')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show_b'],
            [getFieldName('c')]: [getFieldName('b'), 'show_c'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Initially only field_a should be visible
        cy.getTestId(getFieldTestId(getFieldName('a'))).should('exist').should('be.visible')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')
        cy.getTestId(getFieldTestId(getFieldName('c'))).should('not.be.visible')

        // Show field_b
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('show_b')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')
        cy.getTestId(getFieldTestId(getFieldName('c'))).should('not.be.visible')

        // Show field_c
        cy.getTestId(getFieldTestId(getFieldName('b'))).type('show_c')
        cy.getTestId(getFieldTestId(getFieldName('c'))).should('exist').should('be.visible')
      })
    })

    describe('Dependencies combined with bundles', () => {
      it('should apply both bundles and dependencies together', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        const renderRules: RenderRules = {
          bundles: createBundles(['b', 'a']),
          dependencies: {
            [getFieldName('c')]: [getFieldName('a'), 'value1'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Verify bundle order: b, a, d (c is hidden)
        cy.get(`[data-testid^="${getFieldTestId(getFieldName())}"]`).then(($fields) => {
          const visibleFields = filterVisibleElements($fields.toArray())
          const order = visibleFields.map(el => el.getAttribute('data-testid'))
          expect(order).to.deep.equal([
            getFieldTestId(getFieldName('b')),
            getFieldTestId(getFieldName('a')),
            getFieldTestId(getFieldName('d')),
          ])
        })

        // Show field_c by setting field_a
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('value1')
        cy.getTestId(getFieldTestId(getFieldName('c'))).should('exist').should('be.visible')

        // Verify order with c visible: b, a, c, d
        cy.get(`[data-testid^="${getFieldTestId(getFieldName())}"]`).then(($fields) => {
          const visibleFields = filterVisibleElements($fields.toArray())
          const order = visibleFields.map(el => el.getAttribute('data-testid'))
          expect(order).to.deep.equal([
            getFieldTestId(getFieldName('b')),
            getFieldTestId(getFieldName('a')),
            getFieldTestId(getFieldName('c')),
            getFieldTestId(getFieldName('d')),
          ])
        })
      })

      it('should not affect bundle ordering when fields are hidden by dependencies', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        const renderRules: RenderRules = {
          bundles: createBundles(['a', 'b', 'c']),
          dependencies: {
            [getFieldName('b')]: [getFieldName('d'), 'show'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // field_b is hidden, verify order: a, c, d
        verifyFieldOrder(['a', 'c', 'd'])

        // Show field_b
        cy.getTestId(getFieldTestId(getFieldName('d'))).type('show')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')

        // Verify order: a, b, c, d
        verifyFieldOrder(['a', 'b', 'c', 'd'])
      })
    })

    describe('Dependency validation errors', () => {
      it('should detect and report circular dependencies', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('a')]: [getFieldName('b'), 'x'],
            [getFieldName('b')]: [getFieldName('a'), 'y'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Should render despite circular dependency
        verifyFieldsExist('a', 'b')

        // TODO: Verify console error message when validation is implemented
      })

      it('should detect and report self-dependencies', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('a')]: [getFieldName('a'), 'value'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // Should render despite self-dependency
        verifyFieldsExist('a', 'b')

        // TODO: Verify console error message when validation is implemented
      })
    })
  })

  describe('Reactivity', () => {
    describe('Props change reactivity', () => {
      it('should react to renderRules prop changes at runtime', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        cy.mount(Form, {
          props: {
            schema,
            renderRules: { bundles: [] },
          },
        })

        // Initially no bundles, original order
        verifyFieldOrder(['a', 'b', 'c', 'd'])

        // Update renderRules with bundles
        cy.then(() => {
          cy.mount(Form, {
            props: {
              schema,
              renderRules: {
                bundles: createBundles(['d', 'c']),
              },
            },
          })
        })

        // Verify new order
        verifyFieldOrder(['a', 'b', 'd', 'c'])
      })

      it('should restore default behavior when renderRules is removed', () => {
        const schema = createSchema('a', 'b', 'c', 'd')

        cy.mount(Form, {
          props: {
            schema,
            renderRules: {
              bundles: createBundles(['d', 'c']),
            },
          },
        })

        // Verify bundled order
        verifyFieldOrder(['a', 'b', 'd', 'c'])

        // Remove renderRules
        cy.then(() => {
          cy.mount(Form, {
            props: {
              schema,
              renderRules: undefined,
            },
          })
        })

        // Verify original order restored
        verifyFieldOrder(['a', 'b', 'c', 'd'])
      })
    })

    describe('Data change reactivity', () => {
      it('should update dependent fields immediately when dependency field value changes', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
          },
        })

        // field_b should be hidden
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')

        // Type 'show' character by character and verify real-time updates
        cy.getTestId(getFieldTestId(getFieldName('a'))).type('s')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')

        cy.getTestId(getFieldTestId(getFieldName('a'))).type('how')
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')
      })

      it('should reevaluate dependencies when data prop is updated externally', () => {
        const schema = createSchema('a', 'b')

        const renderRules: RenderRules = {
          dependencies: {
            [getFieldName('b')]: [getFieldName('a'), 'show'],
          },
        }

        cy.mount(Form, {
          props: {
            schema,
            renderRules,
            data: {},
          },
        }).then(({ wrapper }) => {
          cy.wrap(wrapper).as('wrapper')
        })

        // field_b should be hidden
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('not.be.visible')

        // Update data prop externally
        cy.get('@wrapper').then((wrapper: any) => {
          wrapper.setProps({
            data: { [getFieldName('a')]: 'show' },
          })
        })

        // field_b should now be visible
        cy.getTestId(getFieldTestId(getFieldName('b'))).should('exist').should('be.visible')
      })
    })
  })
})
