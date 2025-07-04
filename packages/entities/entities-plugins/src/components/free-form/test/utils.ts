import { resolve } from '../shared/utils'
import { buildSchemaMap, defaultLabelFormatter } from '../shared/composables'

import type {
  BooleanFieldSchema,
  NamedFieldSchema,
  RecordFieldSchema,
  StringFieldSchema,
  NumberLikeFieldSchema,
  UnionFieldSchema,
  MapFieldSchema,
  FormSchema,
  ArrayFieldSchema,
  SetFieldSchema,
} from '../../../types/plugins/form-schema'

type AssertFieldOption<T extends UnionFieldSchema = UnionFieldSchema> = {
  fieldSchema: T
  fieldKey: string
  labelOption?: AssertLabelOption
}

type AssertFieldFn<T extends UnionFieldSchema = UnionFieldSchema> = (option: AssertFieldOption<T>) => void

type AssertLabelOption = {
  hide?: boolean
  noAsterisk?: boolean
}

export function assertForm(schema: FormSchema, initialValues?: Record<string, any>) {
  assert(schema, 'Schema should be defined')
  assert(schema.type === 'record', 'Schema type should be "record"')
  assert(schema.fields && Array.isArray(schema.fields), 'Schema should have a "fields" array')

  const schemaMap = buildSchemaMap(schema)

  function assertInitialValues() {
    // todo
  }

  function assertFields(fields: NamedFieldSchema[], prefix?: string) {
    for (const field of fields) {
      const fieldName = Object.keys(field)[0]
      const fieldKey = prefix ? resolve(prefix, fieldName) : fieldName
      const fieldSchema = schemaMap[fieldKey]

      assert(fieldSchema, `Field schema for "${fieldKey}" should exist in the schema map`)

      assertField({ fieldSchema, fieldKey })
    }
  }

  const assertField: AssertFieldFn = ({
    fieldSchema,
    fieldKey,
    labelOption,
  }) => {
    if (fieldSchema.type === 'string') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption })
      } else {
        assertStringField({ fieldKey, fieldSchema, labelOption })
      }
    } else if (fieldSchema.type === 'boolean') {
      assertBooleanField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'record') {
      assertRecordField({ fieldKey, fieldSchema, assertFieldsFn: assertFields, labelOption })
    } else if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption })
      } else {
        assertNumberLikeField({ fieldKey, fieldSchema, labelOption })
      }
    } else if (fieldSchema.type === 'map') {
      assertMapField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'array') {
      assertArrayField({ fieldKey, fieldSchema, assertFieldFn: assertField, labelOption })
    } else if (fieldSchema.type === 'set') {
      assertTagField({ fieldKey, fieldSchema, labelOption })
    } else {
      throw new Error(`Unsupported field type "${fieldSchema.type}" for field "${fieldKey}"`)
    }
  }

  // verify initial values
  if (initialValues) {
    assertInitialValues()
  }

  // verify fields DOM
  assertFields(schema.fields)
}

export const assertStringField: AssertFieldFn<StringFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')

  if (fieldSchema.encrypted) {
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'password')
  } else {
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'text')
  }

  // Check label
  assertLabel({ fieldKey, fieldSchema, labelOption })

  // Check referenceable
  if (fieldSchema.referenceable) {
    cy.getTestId(`ff-vault-secret-picker-warning-${fieldKey}`).should('exist')
  }

  // Check default value
  if (fieldSchema.default) {
    cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default)
    // the placeholder should be `Default: ${fieldSchema.default}
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${fieldSchema.default}`)
  }
}

export const assertEnumField: AssertFieldFn<StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {
}

export const assertNumberLikeField: AssertFieldFn<NumberLikeFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')
  cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'number')

  // Check max and min attributes
  if (fieldSchema.gt) {
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'min', String(fieldSchema.gt))
    cy.getTestId(`ff-${fieldKey}`).should('not.have.attr', 'max')
  } else if (fieldSchema.between) {
    const [min, max] = fieldSchema.between
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'min', String(min))
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'max', String(max))
  }

  // Check label
  assertLabel({ fieldKey, fieldSchema, labelOption })

  // Check default value
  if (fieldSchema.default) {
    cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default)
    // the placeholder should be `Default: ${schema.default}
    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${fieldSchema.default}`)
  }
}

export const assertBooleanField: AssertFieldFn<BooleanFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {
  // Check input element
  cy.getTestId(`ff-${fieldKey}`).should('exist')
  cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'checkbox')

  // Check label
  assertLabel({
    fieldKey,
    fieldSchema,
    labelOption: {
      ...labelOption,
      noAsterisk: true, // Boolean fields do not need asterisk
    },
  })
}

export const assertRecordField = ({
  fieldKey,
  fieldSchema,
  labelOption,
  assertFieldsFn,
}: {
  assertFieldsFn: (fields: NamedFieldSchema[], prefix?: string) => void
} & AssertFieldOption<RecordFieldSchema>) => {
  // Wrapper element should exist
  cy.getTestId(`ff-object-${fieldKey}`).should('exist')

  // Check label
  assertLabel({
    fieldKey,
    fieldSchema,
    labelOption: {
      ...labelOption,
      noAsterisk: true, // Record fields do not need asterisk
    },
  })

  // Check if the content is initially existing
  if (fieldSchema.required || fieldSchema.default) {
    cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')
  }

  // Click the 'add' button
  if (!fieldSchema.default && !fieldSchema.required) {
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).should('exist')
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).click()
    cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')

    // If the field is required, the delete button should not exist
    if (fieldSchema.required) {
      cy.getTestId(`ff-object-remove-btn-${fieldKey}`).should('not.exist')
    } else {
      cy.getTestId(`ff-object-remove-btn-${fieldKey}`).should('exist')
    }
  }

  // Assert child fields
  if (fieldSchema.fields && fieldSchema.fields.length > 0) {
    assertFieldsFn(fieldSchema.fields, fieldKey)
  }

  // Click the 'fold/unfold' button
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).should('exist')
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
  cy.getTestId(`ff-object-content-${fieldKey}`).should('not.exist')
  cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
  cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')

  // Click the 'delete' button
  if (!fieldSchema.required) {
    cy.getTestId(`ff-object-remove-btn-${fieldKey}`).should('exist')
    cy.getTestId(`ff-object-remove-btn-${fieldKey}`).click()
    cy.getTestId(`ff-object-content-${fieldKey}`).should('not.exist')
    cy.getTestId(`ff-object-add-btn-${fieldKey}`).should('exist')
  }
}

export const assertMapField: AssertFieldFn<MapFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {

}

export const assertArrayField = ({
  fieldKey,
  fieldSchema,
  assertFieldFn,
  labelOption,
}: {
  assertFieldFn: AssertFieldFn
} & AssertFieldOption<ArrayFieldSchema>) => {
  // Check wrapper element
  cy.getTestId(`ff-array-${fieldKey}`).should('exist')

  // Check label
  assertLabel({ fieldKey, fieldSchema, labelOption })

  // Check if the content is initially existing
  if (fieldSchema.default && fieldSchema.default.length > 0) {
    cy.getTestId(`ff-array-basic-container-${fieldKey}`).should('exist')
  } else {
    cy.getTestId(`ff-array-basic-container-${fieldKey}`).should('not.exist')
  }

  // Check the 'add' button
  cy.getTestId(`ff-add-item-btn-${fieldKey}`)
    .should('exist')
    .click()
  cy.getTestId(`ff-array-basic-container-${fieldKey}`).should('exist')

  // eslint-disable-next-line promise/catch-or-return
  cy.getTestId(`ff-array-basic-container-${fieldKey}`)
    .find('.ff-array-field-item')
    .its('length')
    .then((itemCount) => {
      const latestIndex = itemCount - 1
      cy.getTestId(`ff-array-item-${fieldKey}.${latestIndex}`).should('exist')

      // Assert child fields
      assertFieldFn({
        fieldSchema: fieldSchema.elements,
        fieldKey: `${fieldKey}.${latestIndex}`,
        labelOption: { hide: true }, // Child fields of array do not need labels
      })

      // Check the 'delete' button
      cy.getTestId(`ff-array-remove-item-btn-${fieldKey}.${latestIndex}`)
        .should('exist')
        .click()

      cy.getTestId(`ff-array-item-${fieldKey}.${latestIndex}`).should('not.exist')
    })
}

export const assertTagField: AssertFieldFn<SetFieldSchema> = ({
  fieldKey,
  fieldSchema,
  labelOption,
}) => {
  // Check wrapper element
  cy.getTestId(`ff-tag-${fieldKey}`).should('exist')

  // Check label
  assertLabel({ fieldKey, fieldSchema, labelOption })
}

export function assertLabel({
  fieldKey,
  fieldSchema,
  labelOption = {},
}: {
  fieldKey: string
  fieldSchema: UnionFieldSchema
  labelOption?: AssertLabelOption
}) {
  if (labelOption.hide) {
    cy.getTestId(`ff-label-${fieldKey}`).should('not.exist')
    return
  }

  cy.getTestId(`ff-label-${fieldKey}`).should('exist')
  cy.getTestId(`ff-label-${fieldKey}`).contains(defaultLabelFormatter(fieldKey))

  if (fieldSchema.required && !labelOption.noAsterisk) {
    cy.getTestId(`ff-label-${fieldKey}`).should('have.class', 'required')
  } else {
    cy.getTestId(`ff-label-${fieldKey}`).should('not.have.class', 'required')
  }

  if (fieldSchema.description) {
    cy.getTestId(`ff-label-${fieldKey}`).should('contain.text', fieldSchema.description)
  }
}
