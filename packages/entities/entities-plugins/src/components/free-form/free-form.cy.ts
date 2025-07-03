import Form from './shared/Form.vue'
import { resolve } from './shared/utils'
import { buildSchemaMap, defaultLabelFormatter } from './shared/composables'
import { buildMockingSchema } from '../../../fixtures/schemas/free-form-mocking'

import type {
  BooleanFieldSchema,
  FormSchema,
  NamedFieldSchema,
  RecordFieldSchema,
  StringFieldSchema,
  NumberLikeFieldSchema,
  UnionFieldSchema,
  MapFieldSchema,
  ArrayLikeFieldSchema,
} from '../../types/plugins/form-schema'


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

function assertForm(schema: FormSchema, initialValues?: Record<string, any>) {
  assert(schema, 'Schema should be defined')
  assert(schema.type === 'record', 'Schema type should be "record"')
  assert(schema.fields && Array.isArray(schema.fields), 'Schema should have a "fields" array')

  const schemaMap = buildSchemaMap(schema)

  // verify initial values
  if (initialValues) {
    assertInitialValues()
  }

  // verify fields DOM
  assertFields(schema.fields)

  function assertInitialValues() {
    // todo
  }

  function assertFields(fields: NamedFieldSchema[], prefix?: string) {
    for (const field of fields) {
      const fieldName = Object.keys(field)[0]
      const fieldKey = prefix ? resolve(prefix, fieldName) : fieldName
      const fieldSchema = schemaMap[fieldKey]

      assert(fieldSchema, `Field schema for "${fieldKey}" should exist in the schema map`)

      if (fieldSchema.type === 'string') {
        if (fieldSchema.one_of) {
          assertEnumField(fieldKey, fieldSchema)
        } else {
          assertStringField(fieldKey, fieldSchema)
        }
      } else if (fieldSchema.type === 'boolean') {
        assertBooleanField(fieldKey, fieldSchema)
      } else if (fieldSchema.type === 'record') {
        assertRecordField(fieldKey, fieldSchema, assertFields)
      } else if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
        if (fieldSchema.one_of) {
          assertEnumField(fieldKey, fieldSchema)
        } else {
          assertNumberLikeField(fieldKey, fieldSchema)
        }
      } else if (fieldSchema.type === 'map') {
        assertMapField(fieldKey, fieldSchema)
      } else if (fieldSchema.type === 'array' || fieldSchema.type === 'set') {
        assertArrayField(fieldKey, fieldSchema)
      } else {
        throw new Error(`Unsupported field type "${fieldSchema.type}" for field "${fieldKey}"`)
      }
    }
  }
}

function assertStringField(fieldKey: string, schema: StringFieldSchema) {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')
  cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'text')

  // Check label
  assertLabel(fieldKey, schema)

  // Check default value
  if (schema.default) {
    cy.getTestId(`ff-${fieldKey}`).should('have.value', schema.default)
  }

  // Check referenceable
  if (schema.referenceable) {
    cy.getTestId(`ff-vault-secret-picker-warning-${fieldKey}`).should('exist')
  }

  // Check default value
  if (schema.default) {
    cy.getTestId(`ff-${fieldKey}`).should('have.value', schema.default)
    // the placeholder should be `Default: ${schema.default}
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${schema.default}`)
  }
}

function assertEnumField(fieldKey: string, schema: StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema) {
}

function assertNumberLikeField(fieldKey: string, schema: NumberLikeFieldSchema) {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')
  cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'number')

  // Check max and min attributes
  if (schema.gt) {
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'min', String(schema.gt))
    cy.getTestId(`ff-${fieldKey}`).should('not.have.attr', 'max')
  } else if (schema.between) {
    const [min, max] = schema.between
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'min', String(min))
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'max', String(max))
  }

  // Check label
  assertLabel(fieldKey, schema)

  // Check default value
  if (schema.default) {
    cy.getTestId(`ff-${fieldKey}`).should('have.value', schema.default)
    // the placeholder should be `Default: ${schema.default}
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${schema.default}`)
  }
}

function assertBooleanField(fieldKey: string, schema: BooleanFieldSchema) {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')
  cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'checkbox')

  // Check label
  assertLabel(fieldKey, schema)
}

function assertRecordField(
  fieldKey: string,
  schema: RecordFieldSchema,
  assertFieldsFn: (fields: NamedFieldSchema[], prefix?: string) => void,
) {
  // Wrapper element should exist
  cy.getTestId(`ff-object-${fieldKey}`).should('exist')

  // Check label
  assertLabel(fieldKey, schema)

  if (schema.required) {
    // Check if the content is initially existing
    cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')
    // If the field is required, the delete button should not exist
    cy.getTestId(`ff-object-remove-btn-${fieldKey}`).should('not.exist')
  }

  // Click the 'add' button
  if (!schema.default && !schema.required) {
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).should('exist')
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).click()
    cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')
  }

  // Assert child fields
  if (schema.fields && schema.fields.length > 0) {
    assertFieldsFn(schema.fields, fieldKey)
  }

  // Click the 'fold/unfold' button
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).should('exist')
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
  cy.getTestId(`ff-object-content-${fieldKey}`).should('not.exist')
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
  cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')

  // Click the 'delete' button
  if (!schema.required) {
    cy.getTestId(`ff-object-remove-btn-${fieldKey}`).should('exist')
    cy.getTestId(`ff-object-remove-btn-${fieldKey}`).click()
    cy.getTestId(`ff-object-content-${fieldKey}`).should('not.exist')
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).should('exist')
  }
}

function assertMapField(fieldKey: string, schema: MapFieldSchema) {

}

function assertArrayField(fieldKey: string, schema: ArrayLikeFieldSchema) {
}

function assertLabel(fieldKey: string, schema: UnionFieldSchema) {
  cy.getTestId(`ff-label-${fieldKey}`).should('exist')
  cy.getTestId(`ff-label-${fieldKey}`).contains(defaultLabelFormatter(fieldKey))

  if (schema.type !== 'record' && schema.type !== 'boolean' && schema.required) {
    cy.getTestId(`ff-label-${fieldKey}`).should('have.class', 'required')
  } else {
    cy.getTestId(`ff-label-${fieldKey}`).should('not.have.class', 'required')
  }

  if (schema.description) {
    cy.getTestId(`ff-label-${fieldKey}`).should('contain.text', schema.description)
  }
}
