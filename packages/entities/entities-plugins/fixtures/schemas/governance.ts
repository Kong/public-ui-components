import type { FormSchema } from '../../src/types/plugins/form-schema'

const governanceSchema: FormSchema = {
  type: 'record',
  supported_partials: { 'redis-ce': ['config.redis'] },
  fields: [{
    config: {
      type: 'record',
      required: true,
      fields: [
        {
          customer: {
            type: 'record',
            required: true,
            fields: [
              {
                look_up_value_in: {
                  type: 'string',
                  one_of: ['consumer', 'application', 'header', 'query'],
                  default: 'consumer',
                },
              },
              { field: { type: 'string' } },
            ],
          },
        },
        {
          feature: {
            type: 'record',
            fields: [
              { key: { type: 'string' } },
            ],
          },
        },
        { credit_balance_required: { type: 'boolean', default: true } },
        { deny_unknown_customers: { type: 'boolean', default: true } },
        {
          response_codes: {
            type: 'record',
            fields: [
              {
                NO_CREDIT_AVAILABLE: {
                  type: 'record',
                  fields: [
                    { http_status: { type: 'integer', default: 402 } },
                    { message: { type: 'string', default: 'Customer has no credit available.' } },
                  ],
                },
              },
              {
                USAGE_LIMIT_REACHED: {
                  type: 'record',
                  fields: [
                    { http_status: { type: 'integer', default: 429 } },
                    { message: { type: 'string', default: 'Customer has reached usage limit for feature.' } },
                  ],
                },
              },
              {
                FEATURE_UNAVAILABLE: {
                  type: 'record',
                  fields: [
                    { http_status: { type: 'integer', default: 403 } },
                    { message: { type: 'string', default: 'Feature is not available for the customer.' } },
                  ],
                },
              },
              {
                FEATURE_NOT_FOUND: {
                  type: 'record',
                  fields: [
                    { http_status: { type: 'integer', default: 403 } },
                    { message: { type: 'string', default: 'Feature not found.' } },
                  ],
                },
              },
              {
                CUSTOMER_NOT_FOUND: {
                  type: 'record',
                  fields: [
                    { http_status: { type: 'integer', default: 404 } },
                    { message: { type: 'string', default: 'Customer is not found by subject.' } },
                  ],
                },
              },
            ],
          },
        },
        { governance_endpoint: { type: 'string', required: true } },
        { api_token: { type: 'string', required: true, referenceable: true } },
        { ssl_verify: { type: 'boolean', default: true } },
        { timeout: { type: 'integer', default: 10000 } },
        { keepalive: { type: 'integer', default: 60000 } },
        { sync_rate: { type: 'integer', default: 2 } },
        { refresh_interval: { type: 'integer', default: 30 } },
        { max_stale_seconds: { type: 'integer', default: 60 } },
        { l1_cache_ttl_seconds: { type: 'integer', default: 5 } },
        { l2_cache_ttl_seconds: { type: 'integer', default: 120 } },
        { fail_policy: { type: 'string', one_of: ['allow', 'deny'], default: 'allow' } },
        {
          redis: {
            type: 'record',
            fields: [
              { host: { type: 'string', default: '127.0.0.1' } },
              { port: { type: 'integer', default: 6379 } },
              { username: { type: 'string' } },
              { password: { type: 'string' } },
              { database: { type: 'integer', default: 0 } },
            ],
          },
        },
      ],
    },
  }],
}

export default governanceSchema
