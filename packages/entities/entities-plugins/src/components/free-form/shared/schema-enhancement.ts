import type { FieldRules } from '../../../types'
import type { EntityCheck, FormSchema } from '../../../types/plugins/form-schema'
import { PLUGIN_METADATA } from '../../../definitions/metadata'

/**
 * Append entity checks from the legacy plugin metadata to the schema
 * All entity checks will be appended to the `config` field
 * @param pluginName - The key of PLUGIN_METADATA
 * @param schema - The original form schema
 */
export function appendEntityChecksFromMetadata(
  pluginName: string,
  schema: FormSchema,
): FormSchema {
  const metadata = PLUGIN_METADATA[pluginName]
  if (!metadata || !metadata.fieldRules) {
    return schema
  }
  const additionalEntityChecks = transformFieldRulesToEntityChecks(metadata.fieldRules)

  const enhancedSchema: FormSchema = { ...schema }

  enhancedSchema.fields = enhancedSchema.fields.map(field => {
    const fieldName = Object.keys(field)[0]
    if (fieldName === 'config') {
      return {
        config: {
          ...field.config,
          entity_checks: [
            ...(field.config.entity_checks || []),
            ...additionalEntityChecks,
          ],
        },
      }
    }
    return field
  })

  return enhancedSchema
}

export function transformFieldRulesToEntityChecks(fieldRules: FieldRules): EntityCheck[] {
  const entityChecks: EntityCheck[] = []

  // Helper function to remove 'config.' prefix from field names
  const removeConfigPrefix = (field: string): string => {
    return field.startsWith('config.') ? field.substring(7) : field
  }

  // Transform atLeastOneOf to at_least_one_of entity checks
  if (fieldRules.atLeastOneOf) {
    fieldRules.atLeastOneOf.forEach(fields => {
      entityChecks.push({
        at_least_one_of: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform onlyOneOf to mutually_exclusive entity checks
  if (fieldRules.onlyOneOf) {
    fieldRules.onlyOneOf.forEach(fields => {
      entityChecks.push({
        mutually_exclusive: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform mutuallyRequired to mutually_required entity checks
  if (fieldRules.mutuallyRequired) {
    fieldRules.mutuallyRequired.forEach(fields => {
      entityChecks.push({
        mutually_required: fields.map(removeConfigPrefix),
      })
    })
  }

  // Transform onlyOneOfMutuallyRequired to a combination of entity checks
  // For each rule, we need to ensure only one group is provided and all fields in that group are required
  // Example: [['http_proxy_host', 'http_proxy_port'], ['https_proxy_host', 'https_proxy_port']]
  // Results in:
  //   - mutually_required: [http_proxy_host, http_proxy_port]
  //   - mutually_required: [https_proxy_host, https_proxy_port]
  //   - mutually_exclusive: [http_proxy_host, https_proxy_host]
  //   - mutually_exclusive: [http_proxy_host, https_proxy_port]
  //   - mutually_exclusive: [http_proxy_port, https_proxy_host]
  //   - mutually_exclusive: [http_proxy_port, https_proxy_port]
  if (fieldRules.onlyOneOfMutuallyRequired) {
    fieldRules.onlyOneOfMutuallyRequired.forEach(rule => {
      // Add mutually_required check for each group
      rule.forEach(group => {
        entityChecks.push({
          mutually_required: group.map(removeConfigPrefix),
        })
      })

      // Add mutually_exclusive checks between fields from different groups
      // This ensures only one group is provided
      if (rule.length > 1) {
        // For each pair of groups, make their fields mutually exclusive
        for (let i = 0; i < rule.length; i++) {
          for (let j = i + 1; j < rule.length; j++) {
            const group1Fields = rule[i].map(removeConfigPrefix)
            const group2Fields = rule[j].map(removeConfigPrefix)

            // Add mutual exclusion between all fields of the two groups
            // This prevents mixing fields from different groups
            group1Fields.forEach(field1 => {
              group2Fields.forEach(field2 => {
                entityChecks.push({
                  mutually_exclusive: [field1, field2],
                })
              })
            })
          }
        }
      }
    })
  }

  return entityChecks
}
