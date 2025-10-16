import { isTagField, resolve } from '../shared/utils'
import { buildAncestor, buildSchemaMap, defaultLabelFormatter, generalizePath } from '../shared/composables'

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
  ForeignFieldSchema,
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

export function assertFormRendering(schema: FormSchema, options?: {
  vaultPickerAvailable?: boolean
}) {
  assert(schema, 'Schema should be defined')
  assert(schema.type === 'record', 'Schema type should be "record"')
  assert(schema.fields && Array.isArray(schema.fields), 'Schema should have a "fields" array')

  const schemaMap = buildSchemaMap(schema)

  function assertFields(fields: NamedFieldSchema[], prefix?: string) {
    for (const field of fields) {
      const fieldName = Object.keys(field)[0]
      const fieldKey = prefix ? resolve(prefix, fieldName) : fieldName
      const path = generalizePath(fieldKey)
      const fieldSchema = schemaMap[path]

      assert(fieldSchema, `Field schema for "${fieldKey}" should exist in the schema map`)

      assertField({ fieldSchema, fieldKey })
    }
  }

  const assertField: AssertFieldFn = ({
    fieldSchema,
    fieldKey,
    labelOption,
  }) => {
    // Determine logic should keep in sync with FieldRenderer.vue
    if (fieldSchema.type === 'string') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption })
      } else {
        assertStringField({ fieldKey, fieldSchema, labelOption })
      }
    } else if (fieldSchema.type === 'boolean') {
      assertBooleanField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'record') {
      assertRecordField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption })
      } else {
        assertNumberLikeField({ fieldKey, fieldSchema, labelOption })
      }
    } else if (fieldSchema.type === 'map') {
      assertKVField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'array') {
      assertArrayField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'set') {
      if (isTagField(fieldSchema)) {
        assertTagField({ fieldKey, fieldSchema, labelOption })
      } else {
        assertEnumField({ fieldKey, fieldSchema, labelOption })
      }
    } else if (fieldSchema.type === 'foreign') {
      assertForeignField({ fieldKey, fieldSchema, labelOption })
    } else if (fieldSchema.type === 'json') {
      assertEditorField({ fieldKey, fieldSchema, labelOption })
    } else {
      throw new Error(`Unsupported field type "${fieldSchema.type}" for field "${fieldKey}"`)
    }
  }

  const assertStringField: AssertFieldFn<StringFieldSchema> = ({
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
      if (options?.vaultPickerAvailable) {
        // todo
      } else {
        cy.getTestId(`ff-vault-secret-picker-warning-${fieldKey}`).should('exist')
      }
    }

    // Check default value
    if (fieldSchema.default) {
      cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default)
      // the placeholder should be `Default: ${fieldSchema.default}
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${fieldSchema.default}`)
    }
  }

  const assertEnumField: AssertFieldFn<StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema | SetFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }) => {
    // Check input element
    cy.getTestId(`ff-${fieldKey}`).should('exist')

    // Check label
    assertLabelBySelector({
      selector: () => cy.getTestId(`ff-${fieldKey}`).parents('.ff-enum-field').children('label'),
      labelText: defaultLabelFormatter(fieldKey),
      fieldSchema,
      labelOption,
    })

    // Click select input
    cy.getTestId(`ff-${fieldKey}`).parents('.select-input')
      .should('exist')
      .click()

    // Check options
    if (fieldSchema.one_of && fieldSchema.one_of.length > 0) {
      cy.getTestId(`ff-${fieldKey}`).parents('.ff-enum-field').find('.k-popover')
        .should('exist')
        .find('.select-item')
        .should('have.length', fieldSchema.one_of.length)

      cy.getTestId(`ff-${fieldKey}`).parents('.select-input').click() // to close the dropdown
    }
  }

  const assertNumberLikeField: AssertFieldFn<NumberLikeFieldSchema> = ({
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

  const assertBooleanField: AssertFieldFn<BooleanFieldSchema> = ({
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

  const getParentSchema = (fieldKey: string) => {
    const { parent } = buildAncestor(fieldKey)
    const parentPath = parent ? parent.path : ''
    return parentPath ? schemaMap[parentPath] : undefined
  }

  const isArrayItem = (fieldKey: string) => {
    const parentSchema = getParentSchema(fieldKey)
    return parentSchema?.type === 'array'
  }

  const assertRecordField = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }: AssertFieldOption<RecordFieldSchema>) => {
    const asChild = isArrayItem(fieldKey)

    // Wrapper element should exist
    cy.getTestId(`ff-object-${fieldKey}`).should('exist')

    // Check label
    assertLabel({
      fieldKey,
      labelText: asChild ? '' : defaultLabelFormatter(fieldKey),
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
    if (!asChild) {
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
    }

    // Assert child fields
    if (fieldSchema.fields && fieldSchema.fields.length > 0) {
      assertFields(fieldSchema.fields, fieldKey)
    }

    // Click the 'fold/unfold' button
    if (!asChild) {
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
  }

  const assertKVField: AssertFieldFn<MapFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }) => {
    // Check wrapper element
    cy.getTestId(`ff-kv-${fieldKey}`).should('exist')

    // Check label
    assertLabel({ fieldKey, fieldSchema, labelOption })

    // Check if the content is initially existing
    if (fieldSchema.default && Object.keys(fieldSchema.default).length > 0) {
      cy.getTestId(`ff-kv-container-${fieldKey}.0`).should('exist')
    }

    // Check the 'add' button
    cy.getTestId(`ff-kv-add-btn-${fieldKey}`)
      .should('exist')
      .click()


    cy.getTestId(`ff-kv-${fieldKey}`)
      .find('.ff-kv-field-entry')
      .its('length')
      .then((itemCount) => {
        const latestIndex = itemCount - 1
        cy.getTestId(`ff-kv-container-${fieldKey}.${latestIndex}`).should('exist')

        // Assert child fields
        cy.getTestId(`ff-key-${fieldKey}.${latestIndex}`).should('exist')

        cy.getTestId(`ff-value-${fieldKey}.${latestIndex}`).should('exist')

        // Check the 'delete' button
        cy.getTestId(`ff-kv-remove-btn-${fieldKey}.${latestIndex}`)
          .should('exist')
          .click()

        cy.getTestId(`ff-kv-container-${fieldKey}.${latestIndex}`).should('not.exist')
      })
  }

  const assertStringArrayOfArrayField = ({
    fieldKey,
  }: AssertFieldOption<ArrayFieldSchema>) => {
    cy.getTestId(`ff-array-basic-container-${fieldKey}`)
      .find('.ff-array-field-item')
      .its('length')
      .then((itemCount) => {
        const latestIndex = itemCount - 1
        // ff-tag-array_of_array.0
        cy.getTestId(`ff-tag-${fieldKey}.${latestIndex}`).should('exist')

        // Check the 'delete' button
        cy.getTestId(`ff-array-remove-item-btn-${fieldKey}.${latestIndex}`)
          .should('exist')
          .click()

        cy.getTestId(`ff-tag-${fieldKey}.${latestIndex}`).should('not.exist')
      })
  }

  const assertArrayField = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }: AssertFieldOption<ArrayFieldSchema>) => {
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

    if (isStringArrayOfArray(fieldSchema)) {
      assertStringArrayOfArrayField({
        fieldKey,
        fieldSchema,
        labelOption,
      })
    } else {
      cy.getTestId(`ff-array-basic-container-${fieldKey}`)
        .find('.ff-array-field-item')
        .its('length')
        .then((itemCount) => {
          const latestIndex = itemCount - 1
          cy.getTestId(`ff-array-item-${fieldKey}.${latestIndex}`).should('exist')

          // Assert child fields
          assertField({
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
  }

  const assertTagField: AssertFieldFn<SetFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }) => {
    // Check wrapper element
    cy.getTestId(`ff-tag-${fieldKey}`).should('exist')

    // Check label
    assertLabel({ fieldKey, fieldSchema, labelOption })

    // Check default value
    if (fieldSchema.default && fieldSchema.default.length > 0) {
      cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default.join(', '))
    }
  }

  function assertLabel({
    fieldKey,
    fieldSchema,
    labelText,
    labelOption = {},
  }: {
    fieldKey: string
    labelText?: string
    fieldSchema: UnionFieldSchema
    labelOption?: AssertLabelOption
  }) {
    assertLabelBySelector({
      selector: () => cy.getTestId(`ff-label-${fieldKey}`),
      labelText: labelText || defaultLabelFormatter(fieldKey),
      fieldSchema,
      labelOption,
    })
  }

  function assertLabelBySelector({
    selector,
    labelText,
    fieldSchema,
    labelOption = {},
  }: {
    selector: () => ReturnType<typeof cy.get>
    labelText: string
    fieldSchema: UnionFieldSchema
    labelOption?: AssertLabelOption
  }) {
    if (labelOption.hide) {
      selector().should('not.exist')
      return
    }

    selector().should('exist')
    selector().contains(labelText)

    if (fieldSchema.required && !labelOption.noAsterisk) {
      selector().should('have.class', 'required')
    } else {
      selector().should('not.have.class', 'required')
    }

    if (fieldSchema.description) {
      selector().should('contain.text', fieldSchema.description)
    }
  }

  const assertForeignField: AssertFieldFn<ForeignFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }) => {
    // Check input element
    cy.getTestId(`ff-${fieldKey}`).should('exist')

    cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'text')

    // Check label
    assertLabel({ fieldKey, fieldSchema, labelOption })

    // Check default value
    if (fieldSchema.default) {
      cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default.id)
      // the placeholder should be `Default: ${fieldSchema.default.id}`
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${fieldSchema.default.id}`)
    }
  }

  const assertEditorField: AssertFieldFn<ForeignFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
  }) => {
    // Check input element
    cy.getTestId(`ff-${fieldKey}`)
      .should('exist')
      .should('have.class', 'editor-container')

    // Check label
    assertLabel({ fieldKey, fieldSchema, labelOption })
  }

  assertFields(schema.fields)
}

function isStringArrayOfArray(fieldSchema: UnionFieldSchema) {
  return fieldSchema.type === 'array'
    && fieldSchema.elements.type === 'array'
    && fieldSchema.elements.elements.type === 'string'
}
