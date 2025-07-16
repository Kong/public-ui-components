export default {
  entity_checks: [],
  fields: [
    {
      protocols: {
        default: [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        required: true,
        elements: {
          type: 'string',
          one_of: [
            'grpc',
            'grpcs',
            'http',
            'https',
          ],
        },
        description: 'A set of strings representing HTTP protocols.',
        type: 'set',
      },
    },
    {
      consumer: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        type: 'foreign',
        reference: 'consumers',
      },
    },
    {
      service: {
        description: "A reference to the 'services' table with a null value allowed.",
        eq: null,
        type: 'foreign',
        reference: 'services',
      },
    },
    {
      config: {
        fields: [
          {
            route_type: {
              description: "The model's operation implementation, for this provider.",
              type: 'string',
              required: true,
              one_of: [
                'llm/v1/chat',
                'llm/v1/completions',
              ],
            },
          },
          {
            auth: {
              fields: [
                {
                  header_name: {
                    description: 'If AI model requires authentication via Authorization or API key header, specify its name here.',
                    type: 'string',
                    referenceable: true,
                    required: false,
                  },
                },
                {
                  header_value: {
                    description: "Specify the full auth header value for 'header_name', for example 'Bearer key' or just 'key'.",
                    required: false,
                    encrypted: true,
                    referenceable: true,
                    type: 'string',
                  },
                },
                {
                  param_name: {
                    description: 'If AI model requires authentication via query parameter, specify its name here.',
                    type: 'string',
                    referenceable: true,
                    required: false,
                  },
                },
                {
                  param_value: {
                    description: "Specify the full parameter value for 'param_name'.",
                    required: false,
                    encrypted: true,
                    referenceable: true,
                    type: 'string',
                  },
                },
                {
                  param_location: {
                    description: "Specify whether the 'param_name' and 'param_value' options go in a query string, or the POST form/JSON body.",
                    type: 'string',
                    required: false,
                    one_of: [
                      'query',
                      'body',
                    ],
                  },
                },
              ],
              required: false,
              type: 'record',
            },
          },
          {
            model: {
              fields: [
                {
                  provider: {
                    description: 'AI provider request format - Kong translates requests to and from the specified backend compatible formats.',
                    type: 'string',
                    required: true,
                    one_of: [
                      'openai',
                      'azure',
                      'anthropic',
                      'cohere',
                      'mistral',
                      'llama2',
                    ],
                  },
                },
                {
                  name: {
                    description: 'Model name to execute.',
                    type: 'string',
                    required: false,
                  },
                },
                {
                  options: {
                    description: 'Key/value settings for the model',
                    type: 'record',
                    fields: [
                      {
                        max_tokens: {
                          description: 'Defines the max_tokens, if using chat or completion models.',
                          type: 'integer',
                          default: 256,
                          required: false,
                        },
                      },
                      {
                        temperature: {
                          description: 'Defines the matching temperature, if using chat or completion models.',
                          between: [
                            0,
                            5,
                          ],
                          required: false,
                          default: 1,
                          type: 'number',
                        },
                      },
                      {
                        top_p: {
                          description: 'Defines the top-p probability mass, if supported.',
                          between: [
                            0,
                            1,
                          ],
                          required: false,
                          default: 1,
                          type: 'number',
                        },
                      },
                      {
                        top_k: {
                          description: 'Defines the top-k most likely tokens, if supported.',
                          between: [
                            0,
                            500,
                          ],
                          required: false,
                          default: 0,
                          type: 'integer',
                        },
                      },
                      {
                        anthropic_version: {
                          description: 'Defines the schema/API version, if using Anthropic provider.',
                          type: 'string',
                          required: false,
                        },
                      },
                      {
                        azure_instance: {
                          description: 'Instance name for Azure OpenAI hosted models.',
                          type: 'string',
                          required: false,
                        },
                      },
                      {
                        azure_api_version: {
                          description: "'api-version' for Azure OpenAI instances.",
                          type: 'string',
                          default: '2023-05-15',
                          required: false,
                        },
                      },
                      {
                        azure_deployment_id: {
                          description: 'Deployment ID for Azure OpenAI instances.',
                          type: 'string',
                          required: false,
                        },
                      },
                      {
                        llama2_format: {
                          description: 'If using llama2 provider, select the upstream message format.',
                          type: 'string',
                          required: false,
                          one_of: [
                            'raw',
                            'openai',
                            'ollama',
                          ],
                        },
                      },
                      {
                        mistral_format: {
                          description: 'If using mistral provider, select the upstream message format.',
                          type: 'string',
                          required: false,
                          one_of: [
                            'openai',
                            'ollama',
                          ],
                        },
                      },
                      {
                        upstream_url: {
                          description: 'Manually specify or override the full URL to the AI operation endpoints, when calling (self-)hosted models, or for running via a private endpoint.',
                          required: false,
                          type: 'string',
                        },
                      },
                    ],
                    required: false,
                  },
                },
              ],
              required: true,
              type: 'record',
            },
          },
          {
            logging: {
              fields: [
                {
                  log_statistics: {
                    description: 'If enabled and supported by the driver, will add model usage and token metrics into the Kong log plugin(s) output.',
                    type: 'boolean',
                    default: true,
                    required: true,
                  },
                },
                {
                  log_payloads: {
                    description: 'If enabled, will log the request and response body into the Kong log plugin(s) output.',
                    type: 'boolean',
                    default: false,
                    required: true,
                  },
                },
              ],
              required: true,
              type: 'record',
            },
          },
        ],
        type: 'record',
        entity_checks: [
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'auth.header_name',
                'auth.param_name',
              ],
              if_match: {
                one_of: [
                  'openai',
                  'azure',
                  'anthropic',
                  'cohere',
                ],
              },
              then_err: 'must set one of %s, and its respective options, when provider is not self-hosted',
            },
          },
          {
            mutually_required: [
              'auth.header_name',
              'auth.header_value',
            ],
          },
          {
            mutually_required: [
              'auth.param_name',
              'auth.param_value',
              'auth.param_location',
            ],
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.llama2_format',
              ],
              if_match: {
                one_of: [
                  'llama2',
                ],
              },
              then_err: 'must set %s for llama2 provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.mistral_format',
              ],
              if_match: {
                one_of: [
                  'mistral',
                ],
              },
              then_err: 'must set %s for mistral provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.name',
              ],
              if_match: [],
              then_err: 'Must set a model name. Refer to https://developer.konghq.com/plugins/ai-proxy/ for supported models.',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.anthropic_version',
              ],
              if_match: {
                one_of: [
                  'anthropic',
                ],
              },
              then_err: 'must set %s for anthropic provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.azure_instance',
              ],
              if_match: {
                one_of: [
                  'azure',
                ],
              },
              then_err: 'must set %s for azure provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.azure_api_version',
              ],
              if_match: {
                one_of: [
                  'azure',
                ],
              },
              then_err: 'must set %s for azure provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.azure_deployment_id',
              ],
              if_match: {
                one_of: [
                  'azure',
                ],
              },
              then_err: 'must set %s for azure provider',
            },
          },
          {
            conditional_at_least_one_of: {
              if_field: 'model.provider',
              then_at_least_one_of: [
                'model.options.upstream_url',
              ],
              if_match: {
                one_of: [
                  'mistral',
                  'llama2',
                ],
              },
              then_err: 'must set %s for self-hosted providers/models',
            },
          },
        ],
        required: true,
      },
    },
  ],
}
