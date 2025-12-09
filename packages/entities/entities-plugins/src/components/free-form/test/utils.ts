import { getName, isTagField, resolve } from '../shared/utils'
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
  isParentDisabled?: boolean
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

  function assertFields({
    fields,
    prefix,
    labelOption,
    isParentDisabled,
  }: {
    fields: NamedFieldSchema[]
    prefix?: string
    labelOption?: AssertLabelOption
    isParentDisabled?: boolean
  }) {
    for (const field of fields) {
      const fieldName = Object.keys(field)[0]
      const fieldKey = prefix ? resolve(prefix, fieldName) : fieldName
      const path = generalizePath(fieldKey)
      const fieldSchema = schemaMap[path]

      assert(fieldSchema, `Field schema for "${fieldKey}" should exist in the schema map`)

      assertField({ fieldSchema, fieldKey, isParentDisabled })
    }
  }

  const assertField: AssertFieldFn = ({
    fieldSchema,
    fieldKey,
    labelOption,
    isParentDisabled,
  }) => {
    if (fieldSchema.type === 'string') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      } else {
        assertStringField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      }
    } else if (fieldSchema.type === 'boolean') {
      assertBooleanField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
    } else if (fieldSchema.type === 'record') {
      assertRecordField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
    } else if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') {
      if (fieldSchema.one_of) {
        assertEnumField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      } else {
        assertNumberLikeField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      }
    } else if (fieldSchema.type === 'map') {
      assertKVField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
    } else if (fieldSchema.type === 'array') {
      assertArrayField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
    } else if (fieldSchema.type === 'set') {
      if (isTagField(fieldSchema)) {
        assertTagField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      } else {
        assertEnumField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
      }
    } else if (fieldSchema.type === 'foreign') {
      assertForeignField({ fieldKey, fieldSchema, labelOption, isParentDisabled })
    } else {
      throw new Error(`Unsupported field type "${fieldSchema.type}" for field "${fieldKey}"`)
    }
  }

  const assertStringField: AssertFieldFn<StringFieldSchema> = ({
    fieldKey,
    fieldSchema,
    labelOption,
    isParentDisabled,
  }) => {
    // Check input element
    cy.getTestId(`ff-${fieldKey}`).should('exist')

    if (fieldSchema.encrypted) {
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'password')
    } else {
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'text')
    }

    // Check label
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

    // Check disabled state
    if (isParentDisabled) {
      cy.getTestId(`ff-${fieldKey}`).should('be.disabled')
    }

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
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
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

    // Check referenceable
    if (fieldSchema.referenceable) {
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'text')
      if (options?.vaultPickerAvailable) {
        // todo
      } else {
        cy.getTestId(`ff-vault-secret-picker-warning-${fieldKey}`).should('exist')
      }
    } else {
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'type', 'number')
    }

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
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

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
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
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
    isParentDisabled,
  }: AssertFieldOption<RecordFieldSchema>) => {
    const asChild = isArrayItem(fieldKey)

    // Wrapper element should exist
    cy.getTestId(`ff-object-${fieldKey}`).should('exist')

    // Check label
    assertLabel({
      fieldKey,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
      fieldSchema,
      labelOption: {
        ...labelOption,
        noAsterisk: true, // Record fields do not need asterisk
      },
    })

    // Check the visibility of the content
    if (!asChild) {
      cy.getTestId(`ff-object-content-${fieldKey}`).should('exist')
      if (fieldSchema.required || fieldSchema.default) {
        cy.getTestId(`ff-object-content-${fieldKey}`).should('be.visible')
      } else {
        cy.getTestId(`ff-object-content-${fieldKey}`).should('not.be.visible')
        // Expand the content for further assertions
        cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).should('exist')
        cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
        cy.getTestId(`ff-object-content-${fieldKey}`).should('be.visible')
      }
    } else {
      cy.getTestId(`ff-object-content-${fieldKey}`).should('not.exist')
      cy.getTestId(`ff-object-${fieldKey}`).should('exist')
    }

    // Click the 'enable' switch button
    // only for non-array-item records
    if (!asChild) {
      // Only optional record fields have the switch button
      if (!fieldSchema.required) {
        cy.getTestId(`ff-object-switch-btn-${fieldKey}`).should('exist')
        cy.getTestId(`ff-object-switch-btn-${fieldKey}`).should(fieldSchema.default ? 'be.checked' : 'not.be.checked')
        cy.log('isParentDisabled:', isParentDisabled)
        // isParentDisabled check
        if (isParentDisabled) {
          cy.getTestId(`ff-object-switch-btn-${fieldKey}`).should('be.disabled')
          // Enable it for further assertions
          cy.getTestId(`ff-object-switch-btn-${fieldKey}`).check({ force: true })
        } else {
          cy.getTestId(`ff-object-switch-btn-${fieldKey}`).should('not.be.disabled')
        }
      } else {
        // Required record fields do not have the switch button
        cy.getTestId(`ff-object-switch-btn-${fieldKey}`).should('not.exist')
      }
    }

    // Check entity checks alert
    if (fieldSchema.entity_checks && fieldSchema.entity_checks.length > 0) {
      cy.getTestId(`ff-object-${fieldKey}`)
        .find('[data-testid="ff-entity-checks-alert"]')
        .should('exist')

      cy.getTestId(`ff-object-${fieldKey}`)
        .find('[data-testid="ff-entity-check-item"]')
        .should('have.length', fieldSchema.entity_checks.length)
    } else {
      cy.getTestId(`ff-object-${fieldKey}`)
        .find('[data-testid="ff-entity-checks-alert"]')
        .should('not.exist')
    }

    // Assert child fields
    if (fieldSchema.fields && fieldSchema.fields.length > 0) {
      assertFields({
        fields: fieldSchema.fields,
        prefix: fieldKey,
        labelOption,
        isParentDisabled: isParentDisabled ?? (
          !fieldSchema.required // not required
          && !fieldSchema.default // no default value
          && !asChild // not a child of an array
        ), // see `initDisabledFields` logic
      })
    }

    // Click the 'fold/unfold' button
    if (!asChild) {
      cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).should('exist')
      cy.getTestId(`ff-object-toggle-btn-${fieldKey}`).click()
      cy.getTestId(`ff-object-content-${fieldKey}`).should('not.be.visible')

      // Disable the field
      if (!fieldSchema.required) {
        cy.getTestId(`ff-object-switch-btn-${fieldKey}`).uncheck({ force: true })
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
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

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
    isParentDisabled,
  }: AssertFieldOption<ArrayFieldSchema>) => {
    // Check wrapper element
    cy.getTestId(`ff-array-${fieldKey}`).should('exist')

    // Check label
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

    // Check if the content is initially existing
    cy.getTestId(`ff-array-basic-container-${fieldKey}`).should('exist')

    // Check disabled state
    if (isParentDisabled) {
      cy.getTestId(`ff-add-item-btn-${fieldKey}`).should('be.disabled')
      return
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
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

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
      console.trace()
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
    assertLabel({
      fieldKey,
      fieldSchema,
      labelOption,
      labelText: defaultLabelFormatter(getName(fieldKey)), // use only the field name for label
    })

    // Check default value
    if (fieldSchema.default) {
      cy.getTestId(`ff-${fieldKey}`).should('have.value', fieldSchema.default.id)
      // the placeholder should be `Default: ${fieldSchema.default.id}`
      cy.getTestId(`ff-${fieldKey}`).should('have.attr', 'placeholder', `Default: ${fieldSchema.default.id}`)
    }
  }

  assertFields({ fields: schema.fields })
}

function isStringArrayOfArray(fieldSchema: UnionFieldSchema) {
  return fieldSchema.type === 'array'
    && fieldSchema.elements.type === 'array'
    && fieldSchema.elements.elements.type === 'string'
}
