import type { FormSchema } from '../../src/types/plugins/form-schema'

// Mirrors the real Kong Gateway ACL plugin schema (`kong.plugins.acl.schema`).
const aclSchema: FormSchema = {
  type: 'record',
  entity_checks: [
    {
      only_one_of: ['config.allow', 'config.deny', 'config.allow_when', 'config.deny_when'],
    },
  ],
  fields: [
    {
      consumer: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        type: 'foreign',
        reference: 'consumers',
      },
    },
    {
      consumer_group: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        type: 'foreign',
        reference: 'consumer_groups',
      },
    },
    {
      protocols: {
        default: ['grpc', 'grpcs', 'http', 'https'],
        type: 'set',
        elements: {
          one_of: ['grpc', 'grpcs', 'http', 'https', 'ws', 'wss'],
          type: 'string',
          len_min: 1,
          required: true,
        },
        required: true,
      },
    },
    {
      config: {
        type: 'record',
        required: true,
        fields: [
          {
            allow: {
              description: 'Arbitrary group names that are allowed to consume the service or route. Exactly one of `config.allow`, `config.deny`, `config.allow_when`, or `config.deny_when` must be specified.',
              elements: { type: 'string' },
              type: 'array',
            },
          },
          {
            deny: {
              description: 'Arbitrary group names that are not allowed to consume the service or route. Exactly one of `config.allow`, `config.deny`, `config.allow_when`, or `config.deny_when` must be specified.',
              elements: { type: 'string' },
              type: 'array',
            },
          },
          {
            hide_groups_header: {
              description: 'If enabled (`true`), prevents the `X-Consumer-Groups` header from being sent in the request to the upstream service. This header is not set when allow_when or deny_when is used.',
              default: false,
              type: 'boolean',
              required: true,
            },
          },
          {
            include_consumer_groups: {
              description: 'If enabled (`true`), allows the consumer-groups to be used in the `allow|deny` fields. This option is ignored when `allow_when` or `deny_when` is used.',
              default: false,
              type: 'boolean',
              required: false,
            },
          },
          {
            always_use_authenticated_groups: {
              description: 'If enabled (`true`), the authenticated groups will always be used even when an authenticated consumer already exists. If the authenticated groups don\'t exist, it will fallback to use the groups associated with the consumer. By default the authenticated groups will only be used when there is no consumer or the consumer is anonymous. This option is ignored when `allow_when` or `deny_when` is effective.',
              default: false,
              type: 'boolean',
              required: true,
            },
          },
          {
            allow_when: {
              description: 'Allow the request if it matches any of these CEL boolean expressions evaluated against the request context (consumer, principal, HTTP attributes, consumer groups, etc.). Exactly one of `config.allow`, `config.deny`, `config.allow_when`, or `config.deny_when` must be specified.',
              elements: { type: 'string', len_min: 1, len_max: 1024 },
              type: 'array',
            },
          },
          {
            deny_when: {
              description: 'Deny the request if it matches any of these CEL boolean expressions evaluated against the request context (consumer, principal, HTTP attributes, consumer groups, etc.). Exactly one of `config.allow`, `config.deny`, `config.allow_when`, or `config.deny_when` must be specified.',
              elements: { type: 'string', len_min: 1, len_max: 1024 },
              type: 'array',
            },
          },
        ],
      },
    },
  ],
}

export default aclSchema

// A Gateway version that predates the `allow_when`/`deny_when` schema fields, so
// ACLModeCard should only offer the allow/deny modes.
export const aclSchemaWithoutWhenModes: FormSchema = {
  ...aclSchema,
  entity_checks: [
    {
      only_one_of: ['config.allow', 'config.deny'],
    },
  ],
  fields: aclSchema.fields.map((field) => {
    if (!('config' in field)) return field

    return {
      config: {
        ...field.config,
        fields: field.config.fields.filter((configField: Record<string, unknown>) => (
          !('allow_when' in configField) && !('deny_when' in configField)
        )),
      },
    }
  }),
}
