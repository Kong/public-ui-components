import { useStringHelpers } from '@kong-ui-public/entities-shared'
import type { FGCollapsibleOptions, FGSlots } from '@kong-ui-public/forms'
import { customFields, getSharedFormName } from '@kong-ui-public/forms'
import { PLUGIN_METADATA } from '../definitions/metadata'
import { aiPromptDecoratorSchema } from '../definitions/schemas/AIPromptDecorator'
import { aiPromptTemplateSchema } from '../definitions/schemas/AIPromptTemplate'
import { aiProxyAdvancedSchema } from '../definitions/schemas/AIProxyAdvanced'
import { aiRateLimitingAdvancedSchema } from '../definitions/schemas/AIRateLimitingAdvanced'
import { applicationRegistrationSchema } from '../definitions/schemas/ApplicationRegistration'
import { ArrayInputFieldSchema } from '../definitions/schemas/ArrayInputFieldSchema'
import { dataDogSchema } from '../definitions/schemas/Datadog'
import { graphqlRateLimitingAdvancedSchema } from '../definitions/schemas/GraphQLRateLimitingAdvanced'
import { mockingSchema } from '../definitions/schemas/Mocking'
import { preFunctionSchema } from '../definitions/schemas/PreFunction'
import { rateLimitingSchema } from '../definitions/schemas/RateLimiting'
import { requestTransformerAdvancedSchema } from '../definitions/schemas/RequestTransformerAdvanced'
import RequestValidatorSchema from '../definitions/schemas/RequestValidator'
import { routeByHeaderSchema } from '../definitions/schemas/RouteByHeader'
import { samlSchema } from '../definitions/schemas/SAML'
import { statsDSchema } from '../definitions/schemas/StatsD'
import { statsDAdvancedSchema } from '../definitions/schemas/StatsDAdvanced'
import { upstreamOauthSchema } from '../definitions/schemas/UpstreamOauth'
import { vaultAuthSchema } from '../definitions/schemas/VaultAuth'
import ZipkinSchema from '../definitions/schemas/Zipkin'
import typedefs from '../definitions/schemas/typedefs'
import { type CustomSchemas } from '../types'
import useI18n from './useI18n'
import usePluginHelpers from './usePluginHelpers'

export interface Field extends Record<string, any> {
  model: string
  required?: boolean
  styleClasses?: string
}

export interface Group {
  legend?: string
  fields?: Field[]
  collapsible?: FGCollapsibleOptions
  slots?: FGSlots
}

export interface Schema {
  fields?: Field[]
  groups?: Group[]
}

export interface UseSchemasOptions {
  app?: 'konnect' | 'kongManager'

  /**
   * The id of the entity associated with the plugin.
   * @defaultValue undefined
   */
  entityId?: string

  /**
   * If the schema is for a plugin credential.
   * @defaultValue false
   */
  credential?: boolean
}

/** Sorts non-config fields and place them at the top */
const sortFieldByNonConfigTakePrecedence = (a: Field, b: Field) => {
  const aIsConfig = a.model.startsWith('config-')
  const bIsConfig = b.model.startsWith('config-')

  if (aIsConfig && !bIsConfig) {
    return 1
  }

  if (!aIsConfig && bIsConfig) {
    return -1
  }

  return 0
}

const sortFieldByOrder = (a: Field, b: Field) => (a.order ?? 0) - (b.order ?? 0)

const sortNonPinnedFields = (a: Field, b: Field) =>
  sortFieldByNonConfigTakePrecedence(a, b) || sortFieldByOrder(a, b) || a.model.localeCompare(b.model)

export const useSchemas = (options?: UseSchemasOptions) => {
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

    'ai-proxy-advanced': {
      ...aiProxyAdvancedSchema,
    },

    'ai-rate-limiting-advanced': {
      ...aiRateLimitingAdvancedSchema,
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

    'upstream-oauth': {
      ...upstreamOauthSchema,
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
    const formModel: any = {}

    // Iterate over each schema field to augment with display configuration.
    inputSchemaFields.forEach(fieldName => {
      buildFormSchema(inputSchema[fieldName], fieldName, inputSchema, formModel, formSchema, frontendSchema)
    })

    const pluginName = formModel.name
    const metadata = PLUGIN_METADATA[pluginName]


    const redisFields = []
    const isRedisField = (field: Field): boolean => {
      const excludePatterns = ['cluster-cache']
      for (const pattern of excludePatterns) {
        if (field.model.includes(pattern)) {
          return false
        }
      }
      return /redis/.test(field.model)
    }


    if (getSharedFormName(pluginName) || metadata?.useLegacyForm || options?.credential) {
      /**
       * Do not generate grouped schema when:
       * - The plugin has a custom layout
       * - The plugin is explicitly marked to use legacy form
       * - Rendering a form for a plugin credential
       */

      // Assume the fields are sorted, unless they have an `order` property
      if (metadata?.useLegacyForm) {
        for (const field of formSchema.fields!) {
          // We group redis fields separately
          if (isRedisField(field)) {
            redisFields.push(field)
            continue
          }
        }
        formSchema.fields = formSchema.fields!.filter((field) => !isRedisField(field))
        // Add redis fields to advanced fields
        if (redisFields.length) formSchema.fields!.push({
          id: '_redis',
          fields: redisFields,
          model: 'redis_partial', // TODO: replace with real redis partial model name
        })
      }


      formSchema.fields!.sort((a: Record<string, any>, b: Record<string, any>) => {
        a.order = a.order || 0
        b.order = b.order || 0

        return a.order - b.order
      })
    } else {
      // Grouped schema generation

      const pinnedFields = []
      const defaultVisibleFields = []
      const advancedFields = []
      const redisFields = []

      // Transform the any of field sets into a flatten set for fast lookup
      // The boolean values help us to know if we have unknown fields in the plugin metadata
      const ruledFields: Record<string, boolean> = {}

      if (metadata?.fieldRules) {
        const flattenRules = [
          ...metadata.fieldRules.atLeastOneOf ?? [],
          ...metadata.fieldRules.onlyOneOf ?? [],
          ...metadata.fieldRules.mutuallyRequired ?? [],
        ]

        if (metadata.fieldRules.onlyOneOfMutuallyRequired) {
          for (const ruleSet of metadata.fieldRules.onlyOneOfMutuallyRequired) {
            flattenRules.push(...ruleSet)
          }
        }

        for (const fields of flattenRules) {
          for (const field of fields) {
            // We flatten the schema with hyphen notation
            ruledFields[field.replace(/-/g, '_').replace(/\./g, '-')] = false // Not visited yet
          }
        }
      }
      for (const field of formSchema.fields!) {
        // We group redis fields separately
        if (isRedisField(field)) {
          redisFields.push(field)
          continue
        }
        // Fields that don't start with 'config-' are considered common fields
        if (field.pinned) {
          pinnedFields.push(field)
          continue
        }

        // A field is hoisted if any of the following is true:
        // - It has a `required` property and it's set to true
        // - Is a field with one or more field rules
        // set Redis fields as advanced fields
        if ((field.required && !isRedisField(field)) || ruledFields[field.model] !== undefined) {
          if (ruledFields[field.model] === false) {
            ruledFields[field.model] = true // Mark this as visited
          }
          defaultVisibleFields.push(field)
          continue
        }

        // Otherwise, consider it an advanced field
        advancedFields.push(field)
      }

      // Add redis fields to advanced fields
      if (redisFields.length) advancedFields.push({
        id: '_redis',
        fields: redisFields,
        model: 'redis_partial', // TODO: replace with real redis partial model name
      })

      // For better dev: warn about unknown checked fields
      const unknownRuleFields = Object.entries(ruledFields)
        .filter(([, visited]) => !visited)
        .map(([field]) => field.replace(/-/g, '.').replace(/_/g, '-'))
      if (unknownRuleFields.length > 0) {
        console.warn(`Unknown checked fields for plugin ${pluginName}: ${unknownRuleFields.join(', ')}`)
      }

      const fieldGroups: Group[] = []

      if (pinnedFields.length > 0) {
        fieldGroups.push({
          fields: pinnedFields.sort(sortFieldByOrder),
        })
      }

      if (defaultVisibleFields.length > 0 || advancedFields.length > 0) {
        fieldGroups.push({
          fields: defaultVisibleFields.sort(sortNonPinnedFields),
          collapsible: {
            title: t('plugins.form.grouping.plugin_configuration.title'),
            description: t('plugins.form.grouping.plugin_configuration.description'),
            nestedCollapsible: {
              fields: advancedFields.sort(sortNonPinnedFields),
              triggerLabel: {
                expand: t('plugins.form.grouping.advanced_parameters.view'),
                collapse: t('plugins.form.grouping.advanced_parameters.hide'),
              },
            },
          },
          slots: {
            beforeContent: 'plugin-config-before-content',
            emptyState: 'plugin-config-empty-state',
          },
        })
      }

      formSchema = {
        groups: fieldGroups,
      }
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
   * sets the appropriate properties for it to be consumed by VFG (vue form generator)
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
    const foreignKeyId = options?.entityId

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
              ...ArrayInputFieldSchema,
              model: schema.model,
              valueArrayType: elementsType === 'integer' ? 'number' : elementsType || 'string',
              inputAttributes: {
                ...ArrayInputFieldSchema.inputAttributes,
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
