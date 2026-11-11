/**
 * Hand-written stand-in for the Admin API schema of the `kong-circuit-breaker`
 * plugin (Gateway 3.17). Field names and descriptions follow the plugin's form
 * design; replace this file with the shipped schema once it is published.
 */
export default {
  fields: [
    {
      protocols: {
        type: 'set',
        required: true,
        default: ['grpc', 'grpcs', 'http', 'https'],
        elements: { type: 'string', one_of: ['grpc', 'grpcs', 'http', 'https'] },
      },
    },
    {
      config: {
        type: 'record',
        required: true,
        fields: [
          {
            failure_circuit: {
              type: 'record',
              required: true,
              fields: [
                { enabled: { type: 'boolean', default: true } },
                {
                  max_failure_count: {
                    type: 'integer',
                    required: true,
                    default: 20,
                    description: 'Number of failures within the sampling window that opens the circuit.',
                  },
                },
                {
                  sampling_window: {
                    type: 'integer',
                    required: true,
                    default: 60,
                    description: 'Length of the window, in seconds, over which failures are counted.',
                  },
                },
                {
                  recovery_period: {
                    type: 'integer',
                    required: true,
                    default: 30,
                    description: 'Time, in seconds, the circuit stays open before moving to half-open.',
                  },
                },
                {
                  failure_percentage: {
                    type: 'integer',
                    default: 20,
                    description: 'Share of failed requests within the window that opens the circuit.',
                  },
                },
                {
                  failure_types: {
                    type: 'set',
                    required: true,
                    default: [
                      'backend_connection_failure',
                      'backend_timeout',
                      'http_5xx',
                      'gateway_processing_failure',
                      'policy_execution_error',
                    ],
                    elements: {
                      type: 'string',
                      one_of: [
                        'backend_connection_failure',
                        'backend_timeout',
                        'http_5xx',
                        'gateway_processing_failure',
                        'policy_execution_error',
                      ],
                    },
                    description: 'Failures that count toward the policy failure circuit.',
                  },
                },
              ],
            },
          },
          {
            latency_circuit: {
              type: 'record',
              required: true,
              fields: [
                { enabled: { type: 'boolean', default: true } },
                {
                  max_upstream_response_time: {
                    type: 'integer',
                    default: 3000,
                    description: 'Time to first byte, in milliseconds, above which a response counts as a failure.',
                  },
                },
                { max_failure_count: { type: 'integer', default: 10 } },
                { sampling_window: { type: 'integer', default: 60 } },
                { window_type: { type: 'string', one_of: ['fixed', 'sliding'], default: 'fixed' } },
                { recovery_period: { type: 'integer', default: 30 } },
              ],
            },
          },
          {
            group_circuits_by: {
              type: 'string',
              one_of: ['service', 'route'],
              default: 'service',
              description: 'Whether one circuit is tracked per Service or per Route.',
            },
          },
          {
            excluded_paths: {
              type: 'array',
              elements: {
                type: 'record',
                fields: [
                  { path: { type: 'string', description: 'Request path that bypasses the circuit breaker.' } },
                  { method: { type: 'string', description: 'HTTP method the exclusion applies to.' } },
                ],
              },
            },
          },
          { half_open_requests: { type: 'integer', default: 5 } },
          { half_open_failure_threshold: { type: 'integer', default: 50 } },
          { half_open_timeout: { type: 'integer', default: 120 } },
          { response_status_code: { type: 'integer', default: 503 } },
          { response_body: { type: 'string', default: 'Service unavailable' } },
        ],
      },
    },
  ],
}
