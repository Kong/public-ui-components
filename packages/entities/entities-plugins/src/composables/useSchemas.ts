import { useStringHelpers } from '@kong-ui-public/entities-shared'
import { customFields } from '@kong-ui-public/forms'
import type { CustomSchemas } from '../types'
import { aiPromptDecoratorSchema } from './plugin-schemas/AIPromptDecorator'
import { aiPromptTemplateSchema } from './plugin-schemas/AIPromptTemplate'
import { applicationRegistrationSchema } from './plugin-schemas/ApplicationRegistration'
import { ArrayStringFieldSchema } from './plugin-schemas/ArrayStringFieldSchema'
import { dataDogSchema } from './plugin-schemas/Datadog'
import { graphqlRateLimitingAdvancedSchema } from './plugin-schemas/GraphQLRateLimitingAdvanced'
import { jwtSchema } from './plugin-schemas/JWT'
import { kafkaSchema } from './plugin-schemas/Kafka'
import { mockingSchema } from './plugin-schemas/Mocking'
import { preFunctionSchema } from './plugin-schemas/PreFunction'
import { rateLimitingSchema } from './plugin-schemas/RateLimiting'
import { requestTransformerAdvancedSchema } from './plugin-schemas/RequestTransformerAdvanced'
import RequestValidatorSchema from './plugin-schemas/RequestValidator'
import { routeByHeaderSchema } from './plugin-schemas/RouteByHeader'
import { samlSchema } from './plugin-schemas/SAML'
import { statsDSchema } from './plugin-schemas/StatsD'
import { statsDAdvancedSchema } from './plugin-schemas/StatsDAdvanced'
import { vaultAuthSchema } from './plugin-schemas/VaultAuth'
import ZipkinSchema from './plugin-schemas/Zipkin'
import typedefs from './plugin-schemas/typedefs'
import useI18n from './useI18n'
import usePluginHelpers from './usePluginHelpers'

export interface Field extends Record<string, any>{
  model: string
  required?: boolean
  styleClasses?: string
}

export interface Group {
  legend?: string
  fields?: Field[]
  collapsible?: boolean
  /**
   * Whether the group is collapsed by default
   * @default false
   */
  collapsedByDefault?: boolean
}

export interface Schema {
  fields?: Field[]
  groups?: Group[]
}

export interface UseSchemasOptions {
  app?: 'konnect' | 'kongManager'
  groupFields?: boolean
}

const sortFieldByOrder = (a: Field, b: Field) => (a.order ?? 0) - (b.order ?? 0)

const sortFieldByOrderAndModel = (a: Field, b: Field) => sortFieldByOrder(a, b) || a.model.localeCompare(b.model)

/**
 * @param entityId (optional) The id of the entity associated with the plugin
 * @returns
 */
export const useSchemas = (entityId?: string, options?: UseSchemasOptions) => {
  const { capitalize } = useStringHelpers()
  const { convertToDotNotation } = usePluginHelpers()
  const { i18n: { t } } = useI18n()

  const customSchemas: CustomSchemas = {
    'application-registration': {
      overwriteDefault: true,
      formSchema: {
        ...applicationRegistrationSchema,
      },
    },

    datadog: {
      ...dataDogSchema,
    },

    'upstream-tls': {
      'config-trusted_certificates': {
        type: 'textArea',
        valueType: 'array',
        rows: 4,
        help: 'A comma separated list of certificate values',
      },
    },

    // KAG-3347: BE descriptions missing. Should remove when BE descriptions are available
    jwt: {
      ...jwtSchema,
    },

    'kafka-upstream': {
      ...kafkaSchema,
    },

    'kafka-log': {
      ...kafkaSchema,
    },

    statsd: {
      ...statsDSchema,
    },

    'statsd-advanced': {
      ...statsDAdvancedSchema,
    },

    'route-by-header': {
      ...routeByHeaderSchema,
    },

    'ai-prompt-decorator': {
      ...aiPromptDecoratorSchema,
    },

    'ai-prompt-template': {
      ...aiPromptTemplateSchema,
    },

    'vault-auth': {
      ...vaultAuthSchema,
    },

    'oas-validation': {
      'config-api_spec': {
        type: 'textArea',
        rows: 15,
      },
    },

    mocking: {
      ...mockingSchema,
    },

    'rate-limiting': {
      ...rateLimitingSchema,
    },

    'rate-limiting-advanced': options?.app === 'kongManager'
      ? {
        'config-consumer_groups': rateLimitingSchema['config-consumer_groups'],
      }
      : {
        ...rateLimitingSchema,
      },

    'graphql-rate-limiting-advanced': {
      ...graphqlRateLimitingAdvancedSchema,
    },

    'response-ratelimiting': {
      ...rateLimitingSchema,
    },

    'pre-function': {
      ...preFunctionSchema,
    },
    // both post and pre function plugin forms need identical schema overrides, so we use PreFunction for both
    'post-function': {
      ...preFunctionSchema,
    },

    'request-transformer-advanced': {
      ...requestTransformerAdvancedSchema,
    },

    'request-validator': {
      ...RequestValidatorSchema,
    },

    zipkin: {
      ...ZipkinSchema,
    },

    saml: {
      ...samlSchema,
    },
  }

  /**
   * a list of form fields not to render across all entity forms
   * @returns {Array} an array of form fields not to render across all entity forms
   */
  const getBlacklist = () => {
    return ['created_at', 'updated_at', 'id']
  }

  /**
   * this method takes in a combined inputSchema and outputs an object containing a model and a schema for VFG form consumption
   * @param {Object} backendSchema the schema obtained via the fetchSchema() method
   * @param {Object} frontendSchema the schema defined in the custom js files
   * @returns {Object} an object containing a formModel and formSchema, both of which will be consumed by the VFG form generator
   */
  const parseSchema = (currentSchema: Record<string, any>, backendSchema?: Record<string, any>, frontendSchema?: Record<string, any>) => {
    let inputSchema: Record<string, any> = {}
    if (backendSchema || currentSchema) {
      inputSchema = backendSchema || (currentSchema.fields ? currentSchema.fields : currentSchema)
    }

    const blacklist = getBlacklist().concat(currentSchema.blacklist ? currentSchema.blacklist : [])

    const inputSchemaFields = Object.keys(inputSchema).filter(f => !blacklist.includes(f))

    // Comparator function for comparing schema objects should not be added to fields
    const comparatorIdx = inputSchemaFields.indexOf('comparator')

    comparatorIdx > -1 && inputSchemaFields.splice(comparatorIdx, 1)

    let formSchema: Schema = { fields: [] }
    const formModel = {}

    // Iterate over each schema field to augment with display configuration.
    inputSchemaFields.forEach(fieldName => {
      buildFormSchema(inputSchema[fieldName], fieldName, inputSchema, formModel, formSchema, frontendSchema)
    })

    if (options?.groupFields) {
      const commonFields = []
      const requiredFields = []
      const advancedFields = []

      for (const field of formSchema.fields!) {
        // Fields that don't start with 'config-' are considered common fields
        if (!field.model.startsWith('config-')) {
          commonFields.push(field)
          continue
        }

        if (field.required) {
          requiredFields.push(field)
          continue
        }

        advancedFields.push(field)
      }

      const fieldGroups: Group[] = []

      if (commonFields.length > 0) {
        fieldGroups.push({
          legend: t('plugins.form.grouping.common_fields'),
          fields: commonFields.sort(sortFieldByOrder),
          collapsible: true,
          collapsedByDefault: false,
        })
      }

      if (requiredFields.length > 0) {
        fieldGroups.push({
          legend: t('plugins.form.grouping.required_fields'),
          fields: requiredFields.sort(sortFieldByOrderAndModel),
          collapsible: true,
          collapsedByDefault: false,
        })
      }

      if (advancedFields.length > 0) {
        fieldGroups.push({
          legend: t('plugins.form.grouping.advanced_fields'),
          fields: advancedFields.sort(sortFieldByOrderAndModel),
          collapsible: true,
          collapsedByDefault: true,
        })
      }

      formSchema = {
        groups: fieldGroups,
      }
    } else {
      // Assume the fields are sorted, unless they have an `order` property
      formSchema.fields!.sort((a: Record<string, any>, b: Record<string, any>) => {
        a.order = a.order || 0
        b.order = b.order || 0

        return a.order - b.order
      })
    }

    return {
      schema: formSchema,
      model: formModel,
      options: {
        noneSelectedText: 'Nothing Selected...',
        helpAsHtml: true,
      },
    }
  }

  const setFieldDefaultValue = (schema: Record<string, any>) => {
    return Array.isArray(schema.default) ||
      (schema.default != null &&
      typeof schema.default !== 'object' &&
      schema.default !== 'function')
  }

  /**
   * This is a helper function for mergeSchema. It takes in a field and depending on the field type,
   * sets the appropiate properties for it to be consumed by VFG (vue form generator)
   * @param {Object} field the field coming from either the backend schema OR a recursive call to be merged with the frontend schema
   * @param {string} key the current backend schema key we are looping over
   * @param {Object} inputSchema this is the inputSchema we are building to be consumed later by parseSchema
   * @param {Object} formModel VFG form model
   * @param {Object} formSchema VFG form schema
   * @param {Object} frontendSchema the schema coming from the frontend (if it exists)
   * @returns {Object} an object representing the combined inputSchema - which will be used by mergeSchema as well as recursive calls
   */
  const buildFormSchema = (field: Record<string, any>, key: string, inputSchema: Record<string, any>, formModel: Record<string, any>, formSchema: Record<string, any>, frontendSchema?: Record<string, any>) => {
    const fieldHasDefaultValue = setFieldDefaultValue(field)

    // Set default value should one exist, or empty string. Existing data
    // will replace this later.
    formModel[key] = fieldHasDefaultValue ? field.default : null
    // Update model to be field name for reference within Vue
    field.id = key
    field.model = key

    if (field.fields && field.type === 'record') {
      handleFieldRecord(field, key, inputSchema, formModel, formSchema, frontendSchema)
    } else {
      inputSchema[key] = field
      fieldSchemaHandler(field, formModel)
      if (frontendSchema && frontendSchema[key]) {
        mergeFrontendSchema(inputSchema[key], frontendSchema[key])
      }

      // Set VFG form schema
      formSchema.fields.push(field)
    }

    return inputSchema
  }

  /**
   *
   * @param {*} backendSchemaVal backend schema key value
   * @param {*} frontendSchemaVal frontend schema key value
   */
  const mergeFrontendSchema = (backendSchemaVal: Record<string, any>, frontendSchemaVal?: Record<string, any>) => {
    if (frontendSchemaVal) {
      Object.assign(backendSchemaVal, frontendSchemaVal)

      if (frontendSchemaVal.label) {
        backendSchemaVal.label = frontendSchemaVal.label
      }
    }

    return backendSchemaVal
  }

  const handleFieldRecord = (field: Record<string, any>, key: string, inputSchema: Record<string, any>, formModel: Record<string, any>, formSchema: Record<string, any>, frontendSchema?: Record<string, any>) => {
    // some fields have subfields inside of it which have their own arrays and keys - which requires a recursive call to setField
    // in order to flatten them up to the top level inputSchema array for displaying - these will be unflattened later in the getModel() call when submitting
    field.fields.forEach((topLevelSchema: Record<string, any>) => {
      Object.keys(topLevelSchema).forEach(propName => {
        const subfield = topLevelSchema[propName]

        inputSchema = buildFormSchema(subfield, key + '-' + propName, inputSchema, formModel, formSchema, frontendSchema)
      })
    })
  }

  /**
   * Handles field of Kong's schema type "foreign" so VFG can understand
   * @param {Object} schema vfg schema to modify
   * @param {*} formModel vfg form model to modify
   */
  const handleFieldForeign = (schema: Record<string, any>, formModel: Record<string, any>) => {
    schema.type = 'input'
    schema.inputType = 'hidden'
    schema.styleClasses = 'kong-form-hidden-field-wrapper'
    const foreignKeyId = entityId

    formModel[schema.model] = foreignKeyId ? { id: foreignKeyId } : null
  }

  const handleFieldNumber = (schema: Record<string, any>) => {
    schema.type = 'input'
    schema.inputType = 'number'

    if (schema.between && schema.between.length === 2) {
      schema.min = schema.between[0]
      schema.max = schema.between[1]
    }
  }

  const handleFieldString = (schema: Record<string, any>) => {
    if (Object.prototype.hasOwnProperty.call(schema, 'one_of')) {
      schema.type = 'select'
      schema.values = schema.one_of
      schema.selectOptions = {
        hideNoneSelectedText: true,
      }
    } else {
      schema.type = 'input'
      schema.inputType = 'text'
    }
  }

  const handleFieldSet = (schema: Record<string, any>) => {
    schema.type = 'input'
    schema.inputType = 'text'
    schema.valueType = 'array'
    schema.valueArrayType = 'string'
  }

  const handleFieldBoolean = (schema: Record<string, any>) => {
    schema.type = 'checkbox'
    schema.default = true
    schema.required = false
  }

  const handleFieldMap = (schema: Record<string, any>) => {
    schema.type = 'object-advanced'

    if (schema.values.type === 'array') {
      const { type: elementsType } = schema.values.elements || {}

      schema.schema = {
        fields: [{
          schema: {
            fields: [{
              ...ArrayStringFieldSchema,
              model: schema.model,
              valueArrayType: elementsType === 'integer' ? 'number' : elementsType || 'string',
              inputAttributes: {
                ...ArrayStringFieldSchema.inputAttributes,
                type: elementsType === 'integer' ? 'number' : 'text',
                inputMode: elementsType === 'integer' ? 'numeric' : 'text',
              },
            }],
          },
        }],
      }
    } else if (schema.values.fields) {
      schema.schema = {
        fields: [
          {
            type: 'object',
            model: 'object',
            schema: {
              fields: schema.values.fields.map((f: Record<string, any>) => {
                const modelName = Object.keys(f)[0]

                return {
                  model: modelName,
                  type: 'input',
                  label: capitalize(modelName),
                  placeholder: modelName,
                  inputType: f[modelName].type,
                }
              }),
            },
          },
        ],
      }
    }
  }

  const buildCustomFields = (schema: Record<string, any>) => {
    return schema.fields.reduce((acc: Record<string, any>, field: Record<string, any>) => {
      if (field.fields) {
        field.fields.forEach((subField: Record<string, any>) => {
          acc[subField.model] = subField
        })
      }

      if (field.model) acc[field.model] = field

      return acc
    }, {})
  }

  /**
   *
   * @param {Object} schema hard-coded schema from file
   * @param {*} formModel VFG Form model
   */
  const handleCustomFields = (schema: Record<string, any>, formModel: Record<string, any>) => {
    if (!customFields.includes(schema.model)) {
      return
    }

    const customFieldsSchema = buildCustomFields(schema)

    customFields.forEach(field => {
      Object.keys(customFieldsSchema).forEach(field => {
        const fieldHasDefaultValue = setFieldDefaultValue(customFieldsSchema[field])

        formModel[field] = fieldHasDefaultValue ? customFieldsSchema[field].default : null
      })
      delete formModel[field]
    })
  }

  /**
 * Format field label
 * @param {Object} schema - vue-form-generator schema
 * @param {string} fieldName - form field name
 * @returns {string}
 */
  const formatFieldLabel = (schema: Record<string, any>, fieldName: string) => {
    if (schema.inputType === 'hidden') {
      // Remove field label or return dot notion label
      return ''

      // When the field is not hidden convert the field name to display the exact same way
      // it is documented (dot notation), not the way it is referenced in the DOM or in code.
      // This can be overridden in the field schema
    }

    return convertToDotNotation(capitalize(schema.label || fieldName.replace(/_/g, ' ')))
  }

  const fieldSchemaHandler = (schema: Record<string, any>, formModel: Record<string, any>) => {
    handleCustomFields(schema, formModel)

    switch (schema.type) {
      case 'foreign':
        handleFieldForeign(schema, formModel)
        break
      case 'number':
        handleFieldNumber(schema)
        schema.attributes = { step: 'any' }
        break
      case 'integer':
        handleFieldNumber(schema)
        break
      case 'string':
        handleFieldString(schema)
        break
      case 'set':
        handleFieldSet(schema)
        break
      case 'boolean':
        handleFieldBoolean(schema)
        break
      case 'map':
        handleFieldMap(schema)
        break
    }

    // For some reason, credential schemas set `inputType` to foreign
    // instead of type
    if (schema.inputType === 'foreign') {
      handleFieldForeign(schema, formModel)
    }

    // Set the field label
    schema.label = formatFieldLabel(schema, schema.model)
  }

  return {
    buildFormSchema,
    parseSchema,
    customSchemas,
    typedefs,
  }
}
