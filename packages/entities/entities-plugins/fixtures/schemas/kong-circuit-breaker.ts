/**
 * The Admin API schema of the `circuit-breaker` plugin, captured from a
 * Gateway 3.17 dev build (`GET /schemas/plugins/circuit-breaker`).
 */
export default {
  'entity_checks': [
    {
      'custom_entity_check': {
        'field_sources': [
          'config',
        ],
      },
    },
  ],
  'fields': [
    {
      'consumer': {
        'type': 'foreign',
        'description': 'Custom type for representing a foreign key with a null value allowed.',
        'reference': 'consumers',
        'eq': null,
      },
    },
    {
      'consumer_group': {
        'type': 'foreign',
        'description': 'Custom type for representing a foreign key with a null value allowed.',
        'reference': 'consumer_groups',
        'eq': null,
      },
    },
    {
      'protocols': {
        'required': true,
        'description': 'A set of strings representing HTTP protocols.',
        'default': [
          'http',
          'https',
        ],
        'elements': {
          'type': 'string',
          'one_of': [
            'http',
            'https',
          ],
        },
        'type': 'set',
      },
    },
    {
      'config': {
        'type': 'record',
        'description': 'Do not use dynamic plugin ordering to run this plugin before authentication or rate limiting. Dynamic ordering changes the access phase only. An already-open circuit then rejects the request before those plugins run. An early exit from those plugins is not a failure sample.',
        'fields': [
          {
            'identifier': {
              'required': true,
              'description': 'Which entity the circuit key uses. A global plugin instance still keys by service, so one backend cannot trip circuits for other backends. A route-level instance has one circuit with either value.',
              'one_of': [
                'service',
                'route',
              ],
              'type': 'string',
              'default': 'service',
            },
          },
          {
            'policy_circuit': {
              'type': 'record',
              'fields': [
                {
                  'enabled': {
                    'type': 'boolean',
                    'description': 'Enable this circuit. At least one circuit must be enabled.',
                    'required': true,
                    'default': false,
                  },
                },
                {
                  'max_failures': {
                    'required': true,
                    'description': 'Open the circuit when the failure count in the window reaches this value. Used when open_when is max_failures, either, or both. The count is checked on each failure, except with both, which waits for the end of the window.',
                    'default': 20,
                    'gt': 0,
                    'type': 'integer',
                  },
                },
                {
                  'sampling_window_seconds': {
                    'required': true,
                    'description': 'Length of the counting window, in seconds. The counter library cannot honor a millisecond window.',
                    'default': 60,
                    'gt': 0,
                    'type': 'integer',
                  },
                },
                {
                  'window_type': {
                    'required': true,
                    'description': 'Sets the window to `sliding` (default) or `fixed`. A sliding window mixes in part of the previous window, so a burst that crosses the boundary can open the circuit. The count can exceed the failures in the current window. Set `fixed` to count only the current window. failure_percentage always uses whole fixed windows.',
                    'one_of': [
                      'fixed',
                      'sliding',
                    ],
                    'type': 'string',
                    'default': 'sliding',
                  },
                },
                {
                  'recovery_period_ms': {
                    'required': true,
                    'description': 'How long the circuit stays open before the next request may probe. Stored as a shared-dictionary TTL, which accepts fractions of a second.',
                    'default': 30000,
                    'between': [
                      100,
                      86400000,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'failure_percentage': {
                    'required': true,
                    'description': 'Open the circuit when the failure percentage of a sampling window reaches this value. Used when open_when is failure_percentage, either, or both. It is checked when the window ends, on the counts of that window. A slow response is a failure in the latency circuit.',
                    'default': 10,
                    'between': [
                      1,
                      100,
                    ],
                    'type': 'number',
                  },
                },
                {
                  'min_samples': {
                    'type': 'integer',
                    'description': 'Minimum number of requests in a finished window before failure_percentage is checked. Leave it unset to check every window that has requests. Set it on low-traffic routes, so that a window with a few requests cannot open the circuit. It is a precondition and is not part of the percentage.',
                    'gt': 0,
                  },
                },
                {
                  'open_when': {
                    'required': true,
                    'description': 'Which thresholds can open the circuit. max_failures (default) uses only the failure count, checked on each failure. failure_percentage uses only the percentage, checked when the window ends. either opens when one of them is crossed. both opens only when both are crossed in the same window, and is checked when the window ends.',
                    'one_of': [
                      'max_failures',
                      'failure_percentage',
                      'either',
                      'both',
                    ],
                    'type': 'string',
                    'default': 'max_failures',
                  },
                },
                {
                  'failure_types': {
                    'required': true,
                    'description': 'Which outcomes count as one policy failure. A single client request increments the counter once, even if several types match.',
                    'default': [
                      'backend_connection_failure',
                      'backend_timeout',
                      'http_5xx',
                      'gateway_processing_failure',
                      'policy_execution_error',
                    ],
                    'elements': {
                      'type': 'string',
                      'one_of': [
                        'backend_connection_failure',
                        'backend_timeout',
                        'http_5xx',
                        'gateway_processing_failure',
                        'policy_execution_error',
                      ],
                    },
                    'type': 'set',
                  },
                },
              ],
              'required': true,
            },
          },
          {
            'latency_circuit': {
              'type': 'record',
              'fields': [
                {
                  'enabled': {
                    'type': 'boolean',
                    'description': 'Enable this circuit. At least one circuit must be enabled.',
                    'required': true,
                    'default': false,
                  },
                },
                {
                  'max_failures': {
                    'required': true,
                    'description': 'Open the circuit when the failure count in the window reaches this value. Used when open_when is max_failures, either, or both. The count is checked on each failure, except with both, which waits for the end of the window.',
                    'default': 10,
                    'gt': 0,
                    'type': 'integer',
                  },
                },
                {
                  'sampling_window_seconds': {
                    'required': true,
                    'description': 'Length of the counting window, in seconds. The counter library cannot honor a millisecond window.',
                    'default': 60,
                    'gt': 0,
                    'type': 'integer',
                  },
                },
                {
                  'window_type': {
                    'required': true,
                    'description': 'Sets the window to `sliding` (default) or `fixed`. A sliding window mixes in part of the previous window, so a burst that crosses the boundary can open the circuit. The count can exceed the failures in the current window. Set `fixed` to count only the current window. failure_percentage always uses whole fixed windows.',
                    'one_of': [
                      'fixed',
                      'sliding',
                    ],
                    'type': 'string',
                    'default': 'sliding',
                  },
                },
                {
                  'recovery_period_ms': {
                    'required': true,
                    'description': 'How long the circuit stays open before the next request may probe. Stored as a shared-dictionary TTL, which accepts fractions of a second.',
                    'default': 30000,
                    'between': [
                      100,
                      86400000,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'failure_percentage': {
                    'required': true,
                    'description': 'Open the circuit when the failure percentage of a sampling window reaches this value. Used when open_when is failure_percentage, either, or both. It is checked when the window ends, on the counts of that window. A slow response is a failure in the latency circuit.',
                    'default': 10,
                    'between': [
                      1,
                      100,
                    ],
                    'type': 'number',
                  },
                },
                {
                  'min_samples': {
                    'type': 'integer',
                    'description': 'Minimum number of requests in a finished window before failure_percentage is checked. Leave it unset to check every window that has requests. Set it on low-traffic routes, so that a window with a few requests cannot open the circuit. It is a precondition and is not part of the percentage.',
                    'gt': 0,
                  },
                },
                {
                  'open_when': {
                    'required': true,
                    'description': 'Which thresholds can open the circuit. max_failures (default) uses only the failure count, checked on each failure. failure_percentage uses only the percentage, checked when the window ends. either opens when one of them is crossed. both opens only when both are crossed in the same window, and is checked when the window ends.',
                    'one_of': [
                      'max_failures',
                      'failure_percentage',
                      'either',
                      'both',
                    ],
                    'type': 'string',
                    'default': 'max_failures',
                  },
                },
                {
                  'max_upstream_ttfb_ms': {
                    'required': true,
                    'description': 'A response is slow when the upstream time to first byte exceeds this value, in milliseconds. Full response time is not used, because a stream can stay open for a long time on a healthy backend.',
                    'default': 3000,
                    'gt': 0,
                    'type': 'integer',
                  },
                },
              ],
              'required': true,
            },
          },
          {
            'half_open_calls': {
              'required': true,
              'description': 'Number of probe requests admitted after the open period. Zero skips Half-Open and closes the circuit on the next request.',
              'default': 5,
              'between': [
                0,
                10000,
              ],
              'type': 'integer',
            },
          },
          {
            'half_open_failure_threshold_percent': {
              'required': true,
              'description': 'Reopen the circuit when the probe failure percentage is greater than or equal to this value. The percentage uses half_open_calls as the total, so the circuit reopens as soon as the probe failures reach it. Otherwise the circuit closes after all probe requests finish. Ignored when half_open_calls is 0.',
              'default': 50,
              'between': [
                1,
                100,
              ],
              'type': 'integer',
            },
          },
          {
            'half_open_timeout_seconds': {
              'required': true,
              'description': 'Seconds to wait in Half-Open, counted from the first probe request. If the probe sample does not finish in this time, the next request closes the circuit.',
              'default': 120,
              'between': [
                1,
                86400,
              ],
              'type': 'integer',
            },
          },
          {
            'response_code': {
              'required': true,
              'description': 'Status code returned while a circuit is open.',
              'default': 503,
              'between': [
                400,
                599,
              ],
              'type': 'integer',
            },
          },
          {
            'response_body': {
              'type': 'string',
              'description': 'Optional body returned while a circuit is open. It is sent as written, with response_content_type. Leave it unset to return the standard Kong error response for the status code.',
            },
          },
          {
            'response_content_type': {
              'required': true,
              'description': 'Content-Type header sent with response_body. Ignored when response_body is unset.',
              'default': 'application/json',
              'not_match': '%c',
              'type': 'string',
            },
          },
        ],
        'required': true,
      },
    },
    {
      'expressions': {
        'type': 'record',
        'fields': [],
        'required': false,
      },
    },
  ],
}
