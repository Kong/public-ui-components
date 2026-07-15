export default {
  'fields': [
    {
      'protocols': {
        'description': 'A set of strings representing protocols.',
        'elements': {
          'description': 'A string representing a protocol, such as HTTP or HTTPS.',
          'one_of': [
            'grpc',
            'grpcs',
            'http',
            'https',
            'tcp',
            'tls',
            'tls_passthrough',
            'udp',
            'ws',
            'wss',
          ],
          'type': 'string',
        },
        'default': [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        'type': 'set',
        'required': true,
      },
    },
    {
      'consumer_group': {
        'reference': 'consumer_groups',
        'description': 'Custom type for representing a foreign key with a null value allowed.',
        'eq': null,
        'type': 'foreign',
      },
    },
    {
      'config': {
        'entity_checks': [
          {
            'at_least_one_of': [
              'traces_endpoint',
              'logs_endpoint',
              'access_logs_endpoint',
              'access_logs.endpoint',
              'metrics',
            ],
          },
        ],
        'type': 'record',
        'fields': [
          {
            'traces_endpoint': {
              'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'logs_endpoint': {
              'description': 'An HTTP URL endpoint where internal logs are exported.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'access_logs': {
              'description': 'Configuration for exporting access logs to an OTLP/HTTP endpoint. If `endpoint` is set, Kong will export access logs (e.g. request/response, route/service, latency, etc.) to the specified endpoint.',
              'entity_checks': [
                {
                  'custom_entity_check': {
                    'field_sources': [
                      'endpoint',
                      'custom_attributes_by_lua',
                    ],
                  },
                },
              ],
              'type': 'record',
              'fields': [
                {
                  'endpoint': {
                    'description': 'An HTTP URL endpoint where access logs (e.g. request/response, route/service, latency, etc.) are exported.',
                    'type': 'string',
                    'referenceable': true,
                    'required': false,
                  },
                },
                {
                  'custom_attributes_by_lua': {
                    'description': 'A key-value map that dynamically modifies access log fields using Lua code.',
                    'type': 'map',
                    'values': {
                      'len_min': 1,
                      'type': 'string',
                    },
                    'keys': {
                      'len_min': 1,
                      'type': 'string',
                    },
                    'required': false,
                  },
                },
              ],
              'required': true,
            },
          },
          {
            'metrics': {
              'description': 'Configuration for exporting metrics to an OTLP/HTTP endpoint. If `endpoint` is set, Kong will export metrics to the specified endpoint at the interval defined by `push_interval`.',
              'type': 'record',
              'fields': [
                {
                  'endpoint': {
                    'description': 'An HTTP URL endpoint where metrics are exported.',
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'push_interval': {
                    'description': 'The interval in seconds at which metrics are pushed to the OTLP server. This setting is only applicable when `endpoint` is set.',
                    'type': 'number',
                    'default': 60,
                    'gt': 0,
                  },
                },
                {
                  'enable_consumer_attribute': {
                    'description': 'A boolean value that determines if `http.server.request.count`, `http.server.request.size` and `http.server.response.size` metrics should fill in the consumer attribute when available.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'enable_request_metrics': {
                    'description': 'A boolean value that determines if request count metrics should be collected. If enabled, `http.server.request.count` metrics will be exported.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'enable_bandwidth_metrics': {
                    'description': 'A boolean value that determines if bandwidth metrics should be collected. If enabled, `http.server.request.size` and `http.server.response.size` metrics will be exported.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'enable_latency_metrics': {
                    'description': 'A boolean value that determines if latency metrics should be collected. If enabled, `kong.latency.total`, `kong.latency.internal` and `kong.latency.upstream` metrics will be exported.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'enable_upstream_health_metrics': {
                    'description': 'A boolean value that determines if upstream health metrics should be collected. If enabled, `kong.upstream.target.status` metrics will be exported.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'enable_ai_metrics': {
                    'description': 'A boolean value that determines if AI metrics should be collected. If enabled, `gen_ai.*`, `mcp.*`, `kong.gen_ai.*`, `kong.gen_ai.a2a.*` and `kong.mcp.*` metrics will be exported. To enable latency metrics for AI metrics, `enable_latency_metrics` must also be set to `true`. To enable `error.type` attribute for AI metrics, `enable_request_metrics` must also be set to `true`.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
              ],
              'required': true,
            },
          },
          {
            'headers': {
              'description': 'The custom headers to be added in the HTTP request sent to the OTLP server. This setting is useful for adding the authentication headers (token) for the APM backend.',
              'type': 'map',
              'keys': {
                'description': 'A string representing an HTTP header name.',
                'type': 'string',
              },
              'values': {
                'referenceable': true,
                'type': 'string',
              },
            },
          },
          {
            'resource_attributes': {
              'description': 'A key-value map of resource attributes to be sent with the telemetry data. The keys and values can be either static or dynamic using Kong variables (e.g. `${kong.service.name}`) for the values. For dynamic values, Lua string template syntax is used and the values will be rendered at runtime.',
              'type': 'map',
              'keys': {
                'required': true,
                'type': 'string',
              },
              'values': {
                'required': true,
                'type': 'string',
              },
            },
          },
          {
            'queue': {
              'default': {
                'max_batch_size': 200,
              },
              'required': true,
              'fields': [
                {
                  'max_batch_size': {
                    'default': 1,
                    'type': 'integer',
                    'description': 'Maximum number of entries that can be processed at a time.',
                    'between': [
                      1,
                      1000000,
                    ],
                  },
                },
                {
                  'max_coalescing_delay': {
                    'default': 1,
                    'type': 'number',
                    'description': 'Maximum number of (fractional) seconds to elapse after the first entry was queued before the queue starts calling the handler.',
                    'between': [
                      0,
                      3600,
                    ],
                  },
                },
                {
                  'max_entries': {
                    'default': 10000,
                    'type': 'integer',
                    'description': 'Maximum number of entries that can be waiting on the queue.',
                    'between': [
                      1,
                      1000000,
                    ],
                  },
                },
                {
                  'max_bytes': {
                    'description': 'Maximum number of bytes that can be waiting on a queue, requires string content.',
                    'type': 'integer',
                  },
                },
                {
                  'max_retry_time': {
                    'default': 60,
                    'description': 'Time in seconds before the queue gives up calling a failed handler for a batch.',
                    'type': 'number',
                  },
                },
                {
                  'initial_retry_delay': {
                    'default': 0.01,
                    'type': 'number',
                    'description': 'Time in seconds before the initial retry is made for a failing batch.',
                    'between': [
                      0.001,
                      1000000,
                    ],
                  },
                },
                {
                  'max_retry_delay': {
                    'default': 60,
                    'type': 'number',
                    'description': 'Maximum time in seconds between retries, caps exponential backoff.',
                    'between': [
                      0.001,
                      1000000,
                    ],
                  },
                },
                {
                  'concurrency_limit': {
                    'default': 1,
                    'description': 'The number of of queue delivery timers. -1 indicates unlimited.',
                    'one_of': [
                      -1,
                      1,
                    ],
                    'type': 'integer',
                  },
                },
              ],
              'type': 'record',
            },
          },
          {
            'batch_span_count': {
              'description': 'The number of spans to be sent in a single batch.',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'opentelemetry: config.batch_span_count is deprecated, please use config.queue.max_batch_size instead',
                'old_default': 200,
              },
              'type': 'integer',
            },
          },
          {
            'batch_flush_delay': {
              'description': 'The delay, in seconds, between two consecutive batches.',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'opentelemetry: config.batch_flush_delay is deprecated, please use config.queue.max_coalescing_delay instead',
                'old_default': 3,
              },
              'type': 'integer',
            },
          },
          {
            'connect_timeout': {
              'default': 1000,
              'type': 'integer',
              'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
              'between': [
                0,
                2147483646,
              ],
            },
          },
          {
            'send_timeout': {
              'default': 5000,
              'type': 'integer',
              'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
              'between': [
                0,
                2147483646,
              ],
            },
          },
          {
            'read_timeout': {
              'default': 5000,
              'type': 'integer',
              'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
              'between': [
                0,
                2147483646,
              ],
            },
          },
          {
            'http_response_header_for_traceid': {
              'type': 'string',
            },
          },
          {
            'header_type': {
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'opentelemetry: config.header_type is deprecated, please use config.propagation options instead',
                'old_default': 'preserve',
              },
              'one_of': [
                'preserve',
                'ignore',
                'b3',
                'b3-single',
                'w3c',
                'jaeger',
                'ot',
                'aws',
                'gcp',
                'datadog',
                'instana',
              ],
              'default': 'preserve',
              'type': 'string',
              'required': false,
            },
          },
          {
            'sampling_rate': {
              'description': 'Tracing sampling rate for configuring the probability-based sampler. When set, this value supersedes the global `tracing_sampling_rate` setting from kong.conf.',
              'type': 'number',
              'required': false,
              'between': [
                0,
                1,
              ],
            },
          },
          {
            'propagation': {
              'default': {
                'default_format': 'w3c',
              },
              'type': 'record',
              'fields': [
                {
                  'extract': {
                    'description': 'Header formats used to extract tracing context from incoming requests. If multiple values are specified, the first one found will be used for extraction. If left empty, Kong will not extract any tracing context information from incoming requests and generate a trace with no parent and a new trace ID.',
                    'elements': {
                      'one_of': [
                        'b3',
                        'jaeger',
                        'ot',
                        'datadog',
                        'aws',
                        'gcp',
                        'instana',
                        'w3c',
                      ],
                      'type': 'string',
                    },
                    'type': 'array',
                  },
                },
                {
                  'clear': {
                    'description': 'Header names to clear after context extraction. This allows to extract the context from a certain header and then remove it from the request, useful when extraction and injection are performed on different header formats and the original header should not be sent to the upstream. If left empty, no headers are cleared.',
                    'elements': {
                      'type': 'string',
                    },
                    'type': 'array',
                  },
                },
                {
                  'inject': {
                    'description': 'Header formats used to inject tracing context. The value `preserve` will use the same header format as the incoming request. If multiple values are specified, all of them will be used during injection. If left empty, Kong will not inject any tracing context information in outgoing requests.',
                    'elements': {
                      'one_of': [
                        'preserve',
                        'b3',
                        'b3-single',
                        'jaeger',
                        'ot',
                        'datadog',
                        'aws',
                        'gcp',
                        'instana',
                        'w3c',
                      ],
                      'type': 'string',
                    },
                    'type': 'array',
                  },
                },
                {
                  'default_format': {
                    'description': 'The default header format to use when extractors did not match any format in the incoming headers and `inject` is configured with the value: `preserve`. This can happen when no tracing header was found in the request, or the incoming tracing header formats were not included in `extract`.',
                    'type': 'string',
                    'one_of': [
                      'b3',
                      'b3-single',
                      'jaeger',
                      'ot',
                      'datadog',
                      'aws',
                      'gcp',
                      'instana',
                      'w3c',
                    ],
                    'required': true,
                  },
                },
              ],
              'required': true,
            },
          },
          {
            'sampling_strategy': {
              'description': 'The sampling strategy to use for OTLP `traces`. Set `parent_drop_probability_fallback` if you want parent-based sampling when the parent span contains a `false` sampled flag, and fallback to probability-based sampling otherwise. Set `parent_probability_fallback` if you want parent-based sampling when the parent span contains a valid sampled flag (`true` or `false`), and fallback to probability-based sampling otherwise.',
              'one_of': [
                'parent_drop_probability_fallback',
                'parent_probability_fallback',
              ],
              'default': 'parent_drop_probability_fallback',
              'type': 'string',
              'required': true,
            },
          },
        ],
        'shorthand_fields': [
          {
            'endpoint': {
              'deprecation': {
                'message': 'OpenTelemetry: config.endpoint is deprecated, please use config.traces_endpoint instead',
                'removal_in_version': '4.0',
              },
              'referenceable': true,
              'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              'type': 'string',
            },
          },
          {
            'access_logs_endpoint': {
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'OpenTelemetry: config.access_logs_endpoint is deprecated, please use config.access_logs.endpoint instead',
                'replaced_with': [
                  {
                    'path': [
                      'access_logs',
                      'endpoint',
                    ],
                  },
                ],
              },
              'referenceable': true,
              'description': 'An HTTP URL endpoint where access logs (e.g. request/response, route/service, latency, etc.) are exported.',
              'type': 'string',
            },
          },
        ],
        'required': true,
      },
    },
  ],
  'entity_checks': [
    {
      'custom_entity_check': {
        'field_sources': [
          'config',
        ],
      },
    },
  ],
}
