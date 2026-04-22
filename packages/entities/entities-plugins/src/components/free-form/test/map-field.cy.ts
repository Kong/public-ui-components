import { ref } from 'vue'
import Form from '../shared/Form.vue'
import MapField from '../shared/MapField.vue'
import StringArrayField from '../shared/StringArrayField.vue'
import type { FormSchema, UnionFieldSchema } from 'src/types/plugins/form-schema'

const FIELD_NAME = 'kv'

function createMapSchema(options: {
  required?: boolean
  defaultValue?: Record<string, unknown>
  values?: UnionFieldSchema
  appearance?: {
    string?: {
      multiline?: boolean
    }
  }
} = {}): FormSchema {
  return {
    type: 'record',
    fields: [{
      [FIELD_NAME]: {
        type: 'map',
        keys: { type: 'string' },
        values: options.values ?? { type: 'string' },
        ...(options.required ? { required: true } : {}),
        ...(options.defaultValue !== undefined ? { default: options.defaultValue } : {}),
        ...(options.appearance ? { appearance: options.appearance } : {}),
      },
    }],
  } as FormSchema
}

function mountMapForm(options: {
  schema?: FormSchema
  data?: Record<string, unknown> | null | ReturnType<typeof ref<Record<string, unknown>>>
  multiline?: boolean
  oneLine?: boolean
  slotTemplate?: string
}) {
  const useCustomMapField = options.multiline || options.oneLine || options.slotTemplate

  const mapFieldAttrs = [
    'name="kv"',
    options.oneLine ? 'one-line' : '',
    options.multiline ? ':appearance="{ string: { multiline: true } }"' : '',
  ].filter(Boolean).join(' ')

  const mapFieldTemplate = options.slotTemplate
    ? `<MapField ${mapFieldAttrs}><template #default="{ keyId }">${options.slotTemplate}</template></MapField>`
    : `<MapField ${mapFieldAttrs} />`

  cy.mount(Form, {
    props: {
      schema: options.schema ?? createMapSchema(),
      data: options.data,
      onChange: cy.spy().as('onChangeSpy'),
    },
    ...(useCustomMapField
      ? {
        slots: {
          default: mapFieldTemplate,
        },
        global: {
          components: {
            MapField,
            StringArrayField,
          },
        },
      }
      : {}),
  })
}

function getMapRows() {
  return cy.getTestId(`ff-map-${FIELD_NAME}`).find(`[data-testid^="ff-map-container-${FIELD_NAME}."]`)
}

function getMapRow(index: number) {
  return cy.getTestId(`ff-map-container-${FIELD_NAME}.${index}`)
}

function getKeyInput(index: number) {
  return cy.getTestId(`ff-map-key-${FIELD_NAME}.${index}`)
}

function getValueControl(index: number) {
  return getMapRow(index).find(`[data-testid^="ff-${FIELD_NAME}."]`).first()
}

function assertLastChange(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    expect(spy.lastCall?.args[0]).to.deep.equal(expected)
  })
}

function assertChangeCalledWith(expected: Record<string, unknown>) {
  cy.get('@onChangeSpy').should((spy: any) => {
    const hasExpectedCall = spy.getCalls().some((call: any) => Cypress._.isEqual(call.args[0], expected))
    expect(hasExpectedCall).to.equal(true)
  })
}

describe('MapField', () => {
  describe('Initialization', () => {
    it('should initialize with default value', () => {
      mountMapForm({
        schema: createMapSchema({
          defaultValue: { key1: 'value1' },
        }),
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { kv: { key1: 'value1' } })
    })

    it('should initialize to null when no default and not required', () => {
      mountMapForm({
        schema: createMapSchema(),
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { kv: null })
    })

    it('should initialize with initial value from data prop', () => {
      const initialData = { kv: { foo: 'bar', baz: 'qux' } }

      mountMapForm({
        data: initialData,
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', initialData)

      getMapRows().should('have.length', 2)
      getKeyInput(0).should('have.value', 'foo')
      getValueControl(0).should('have.value', 'bar')
      getKeyInput(1).should('have.value', 'baz')
      getValueControl(1).should('have.value', 'qux')
    })
  })

  describe('Empty value', () => {
    it('should initialize to {} when required and no default', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { kv: {} })
    })

    it('should initialize to null when not required and no default', () => {
      mountMapForm({
        schema: createMapSchema(),
      })

      cy.get('@onChangeSpy')
        .should('have.been.calledOnce')
        .should('have.been.calledWith', { kv: null })
    })
  })

  describe('Active update by user operation', () => {
    it('should add a new entry', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
      })

      cy.getTestId(`ff-map-add-btn-${FIELD_NAME}`).click()

      getMapRows().should('have.length', 1)
      getKeyInput(0).should('have.value', '')
      getValueControl(0).should('have.value', '')
      assertLastChange({ kv: { '': null } })
    })

    it('should remove an entry', () => {
      mountMapForm({
        data: { kv: { foo: 'bar' } },
      })

      cy.getTestId(`ff-map-remove-btn-${FIELD_NAME}.0`).click()

      getMapRows().should('have.length', 0)
      assertLastChange({ kv: null })
    })

    it('should edit a key', () => {
      mountMapForm({
        data: { kv: { foo: 'bar' } },
      })

      getKeyInput(0).clear().type('newkey')

      assertLastChange({ kv: { newkey: 'bar' } })
    })

    it('should edit a value', () => {
      mountMapForm({
        data: { kv: { foo: 'bar' } },
      })

      getValueControl(0).clear().type('newvalue')

      assertLastChange({ kv: { foo: 'newvalue' } })
    })
  })

  describe('Passive update by external data prop change', () => {
    it('should update when data prop changes', () => {
      const data = ref<{ kv: Record<string, string> }>({ kv: { foo: 'bar' } })
      const newData = { kv: { hello: 'world' } }

      mountMapForm({ data })

      getKeyInput(0).should('have.value', 'foo')
      getValueControl(0).should('have.value', 'bar')
      assertChangeCalledWith(data.value)

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(0).then(() => {
        data.value = newData
      })

      getMapRows().should('have.length', 1)
      getKeyInput(0).should('have.value', 'hello')
      getValueControl(0).should('have.value', 'world')
      assertChangeCalledWith(newData)
    })
  })

  describe('Complex map', () => {
    it('should render and handle complex map with record values', () => {
      mountMapForm({
        schema: createMapSchema({
          values: {
            type: 'record',
            required: true,
            fields: [
              {
                name: {
                  type: 'string',
                },
              },
            ],
          },
        }),
        data: { kv: { foo: { name: 'Alice' } } },
      })

      getMapRow(0).should('have.class', 'ff-map-field-item-complex')
      getMapRow(0).find('input[data-testid^="ff-kv."]').should('have.value', 'Alice')

      getMapRow(0).find('input[data-testid^="ff-kv."]').clear().type('Bob')

      assertLastChange({ kv: { foo: { name: 'Bob' } } })
    })
  })

  describe('Empty value on remove all entries', () => {
    it('should emit {} when removing all entries from required map', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
        data: { kv: { foo: 'bar' } },
      })

      cy.getTestId(`ff-map-remove-btn-${FIELD_NAME}.0`).click()

      assertLastChange({ kv: {} })
    })

    it('should emit null when removing all entries from optional map', () => {
      mountMapForm({
        schema: createMapSchema(),
        data: { kv: { foo: 'bar' } },
      })

      cy.getTestId(`ff-map-remove-btn-${FIELD_NAME}.0`).click()

      assertLastChange({ kv: null })
    })
  })

  describe('isSimpleMap rendering logic', () => {
    it('should render simple layout for string value maps', () => {
      mountMapForm({
        data: { kv: { foo: 'bar' } },
      })

      getMapRow(0).should('have.class', 'ff-map-field-item-simple')
    })

    it('should render complex layout for record value maps', () => {
      mountMapForm({
        schema: createMapSchema({
          values: {
            type: 'record',
            required: true,
            fields: [
              {
                name: {
                  type: 'string',
                },
              },
            ],
          },
        }),
        data: { kv: { foo: { name: 'bar' } } },
      })

      getMapRow(0).should('have.class', 'ff-map-field-item-complex')
    })
  })

  describe('Appearance props', () => {
    it('should render multiline textarea when appearance.string.multiline is true', () => {
      mountMapForm({
        schema: createMapSchema(),
        data: { kv: { foo: 'line 1' } },
        multiline: true,
      })

      getMapRow(0).should('have.class', 'ff-map-field-item-complex')
      getMapRow(0).find('textarea[data-testid^="ff-kv."]').should('have.value', 'line 1')
    })

    it('should not trigger add on Enter in multiline mode', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
        data: { kv: { foo: 'line 1' } },
        multiline: true,
      })

      getMapRows().should('have.length', 1)
      getMapRow(0).find('textarea[data-testid^="ff-kv."]').type('{enter}line 2')
      getMapRows().should('have.length', 1)
    })
  })

  describe('Edge cases', () => {
    it('should handle duplicate key names (last-write-wins in output)', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
      })

      cy.getTestId(`ff-map-add-btn-${FIELD_NAME}`).click()
      getKeyInput(0).type('dup')
      getValueControl(0).type('one')

      cy.getTestId(`ff-map-add-btn-${FIELD_NAME}`).click()
      getKeyInput(1).type('dup')
      getValueControl(1).type('two')

      getMapRows().should('have.length', 2)
      assertLastChange({ kv: { dup: 'two' } })
    })

    it('should handle empty key names', () => {
      mountMapForm({
        schema: createMapSchema({ required: true }),
      })

      cy.getTestId(`ff-map-add-btn-${FIELD_NAME}`).click()
      getValueControl(0).type('value')

      assertLastChange({ kv: { '': 'value' } })
    })
  })

  describe('oneLine prop', () => {
    it('should force simple layout even when value schema is non-simple (array)', () => {
      mountMapForm({
        schema: createMapSchema({
          values: {
            type: 'array',
            elements: { type: 'string' },
          },
        }),
        data: { kv: { foo: ['a', 'b'] } },
        oneLine: true,
      })

      getMapRow(0)
        .should('have.class', 'ff-map-field-item-simple')
        .and('not.have.class', 'ff-map-field-item-complex')
    })

    it('should render complex layout by default (without oneLine) for non-simple value schema', () => {
      mountMapForm({
        schema: createMapSchema({
          values: {
            type: 'array',
            elements: { type: 'string' },
          },
        }),
        data: { kv: { foo: ['a', 'b'] } },
      })

      getMapRow(0)
        .should('have.class', 'ff-map-field-item-complex')
        .and('not.have.class', 'ff-map-field-item-simple')
    })
  })

  describe('Default slot override', () => {
    it('should render consumer-provided default slot instead of built-in controls and wire keyId as the name', () => {
      mountMapForm({
        schema: createMapSchema({
          values: {
            type: 'array',
            elements: { type: 'string' },
          },
        }),
        data: { kv: { foo: ['a', 'b'] } },
        oneLine: true,
        slotTemplate: '<StringArrayField :name="keyId" />',
      })

      // The consumer-provided StringArrayField renders (its wrapper has ff-tag-<path> testid).
      getMapRow(0).find('[data-testid^="ff-tag-kv.kid:"]').should('exist')

      // The built-in StringField fallback is NOT rendered (no .ff-string-field class inside the row).
      getMapRow(0).find('.ff-string-field').should('not.exist')

      // The slot input is wired to the correct field (name=keyId): existing data flows in
      // at the kv.<keyId> path, and edits propagate back to the original logical key "foo".
      getMapRow(0)
        .find('input[data-testid^="ff-kv.kid:"]')
        .should('have.value', 'a, b')
        .clear()
        .type('x, y, z')

      assertLastChange({ kv: { foo: ['x', 'y', 'z'] } })
    })

    it('should expose keyId via scoped slot and suppress built-in fallback', () => {
      mountMapForm({
        data: { kv: { foo: 'bar' } },
        slotTemplate: '<div data-testid="custom-slot" :data-key-id="keyId">{{ keyId }}</div>',
      })

      // Custom slot is rendered.
      getMapRow(0).find('[data-testid="custom-slot"]').should('exist')

      // Slot prop keyId matches the kid:<n> format used elsewhere (and matches the
      // keyId on the remove button testid `ff-map-remove-btn-kv.<keyId>.0`).
      getMapRow(0)
        .find('[data-testid="custom-slot"]')
        .invoke('attr', 'data-key-id')
        .should('match', /^kid:\d+$/)

      // Built-in StringField/Field fallbacks are NOT rendered.
      getMapRow(0).find('.ff-string-field').should('not.exist')
      getMapRow(0).find('input[data-testid^="ff-kv."]').should('not.exist')
    })
  })
})
