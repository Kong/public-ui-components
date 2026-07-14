export default {
  'entity_checks': [
    {
      'at_least_one_of': [
        'config.second',
        'config.minute',
        'config.hour',
        'config.day',
        'config.month',
        'config.year',
      ],
    },
    {
      'conditional': {
        'if_field': 'config.policy',
        'if_match': {
          'eq': 'redis',
        },
        'then_field': 'config.redis.host',
        'then_match': {
          'required': true,
        },
      },
    },
    {
      'conditional': {
        'if_field': 'config.policy',
        'if_match': {
          'eq': 'redis',
        },
        'then_field': 'config.redis.port',
        'then_match': {
          'required': true,
        },
      },
    },
    {
      'conditional': {
        'if_field': 'config.policy',
        'if_match': {
          'eq': 'redis',
        },
        'then_field': 'config.redis.timeout',
        'then_match': {
          'required': true,
        },
      },
    },
    {
      'conditional': {
        'if_field': 'config.limit_by',
        'if_match': {
          'eq': 'header',
        },
        'then_field': 'config.header_name',
        'then_match': {
          'required': true,
        },
      },
    },
    {
      'conditional': {
        'if_field': 'config.limit_by',
        'if_match': {
          'eq': 'path',
        },
        'then_field': 'config.path',
        'then_match': {
          'required': true,
        },
      },
    },
  ],
  'fields': [
    {
      'protocols': {
        'default': [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        'description': 'A set of strings representing HTTP protocols.',
        'elements': {
          'one_of': [
            'grpc',
            'grpcs',
            'http',
            'https',
          ],
          'type': 'string',
        },
        'required': true,
        'type': 'set',
      },
    },
    {
      'config': {
        'fields': [
          {
            'second': {
              'description': 'The number of HTTP requests that can be made per second.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'minute': {
              'description': 'The number of HTTP requests that can be made per minute.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'hour': {
              'description': 'The number of HTTP requests that can be made per hour.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'day': {
              'description': 'The number of HTTP requests that can be made per day.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'month': {
              'description': 'The number of HTTP requests that can be made per month.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'year': {
              'description': 'The number of HTTP requests that can be made per year.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'limit_by': {
              'default': 'consumer',
              'description': 'The entity that is used when aggregating the limits.',
              'one_of': [
                'consumer',
                'credential',
                'ip',
                'service',
                'header',
                'path',
                'consumer-group',
              ],
              'type': 'string',
            },
          },
          {
            'header_name': {
              'description': 'A string representing an HTTP header name.',
              'type': 'string',
            },
          },
          {
            'path': {
              'description': 'A string representing a URL path, such as /path/to/resource. Must start with a forward slash (/) and must not contain empty segments (i.e., two consecutive forward slashes).',
              'match_none': [
                {
                  'err': 'must not have empty segments',
                  'pattern': '//',
                },
              ],
              'starts_with': '/',
              'type': 'string',
            },
          },
          {
            'policy': {
              'default': 'local',
              'description': 'The rate-limiting policies to use for retrieving and incrementing the limits.',
              'len_min': 0,
              'one_of': [
                'local',
                'redis',
              ],
              'type': 'string',
            },
          },
          {
            'fault_tolerant': {
              'default': true,
              'description': 'A boolean value that determines if the requests should be proxied even if Kong has troubles connecting a third-party data store. If `true`, requests will be proxied anyway, effectively disabling the rate-limiting function until the data store is working again. If `false`, then the clients will see `500` errors.',
              'required': true,
              'type': 'boolean',
            },
          },
          {
            'redis': {
              'description': 'Redis configuration',
              'entity_checks': [
                {
                  'custom_entity_check': {
                    'field_sources': [
                      'ssl',
                      'ssl_verify',
                    ],
                    'run_with_missing_fields': true,
                  },
                },
              ],
              'fields': [
                {
                  'host': {
                    'description': 'A string representing a host name, such as example.com.',
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'port': {
                    'between': [
                      0,
                      65535,
                    ],
                    'default': 6379,
                    'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                    'referenceable': true,
                    'type': 'integer',
                  },
                },
                {
                  'timeout': {
                    'between': [
                      0,
                      2147483646,
                    ],
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'type': 'integer',
                  },
                },
                {
                  'username': {
                    'description': "Username to use for Redis connections. If undefined, ACL authentication won't be performed. This requires Redis v6.0.0+. To be compatible with Redis v5.x.y, you can set it to `default`.",
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'password': {
                    'description': 'Password to use for Redis connections. If undefined, no AUTH commands are sent to Redis.',
                    'encrypted': true,
                    'len_min': 0,
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'cloud_authentication': {
                    'description': "Cloud auth related configs for connecting to a Cloud Provider's Redis instance.",
                    'entity_checks': [
                      {
                        'mutually_required': [
                          'aws_access_key_id',
                          'aws_secret_access_key',
                        ],
                      },
                      {
                        'mutually_required': [
                          'aws_assume_role_arn',
                          'aws_role_session_name',
                        ],
                      },
                      {
                        'custom_entity_check': {
                          'field_sources': [
                            'auth_provider',
                            'aws_cache_name',
                          ],
                        },
                      },
                    ],
                    'fields': [
                      {
                        'auth_provider': {
                          'description': "Auth providers to be used to authenticate to a Cloud Provider's Redis instance.",
                          'one_of': [
                            'aws',
                            'gcp',
                            'azure',
                          ],
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_cache_name': {
                          'description': 'The name of the AWS Elasticache cluster when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_region': {
                          'description': 'The region of the AWS ElastiCache cluster when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_is_serverless': {
                          'default': true,
                          'description': 'This flag specifies whether the cluster is serverless when auth_provider is set to `aws`.',
                          'required': false,
                          'type': 'boolean',
                        },
                      },
                      {
                        'aws_access_key_id': {
                          'description': 'AWS Access Key ID to be used for authentication when `auth_provider` is set to `aws`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_secret_access_key': {
                          'description': 'AWS Secret Access Key to be used for authentication when `auth_provider` is set to `aws`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_assume_role_arn': {
                          'description': 'The ARN of the IAM role to assume for generating ElastiCache IAM authentication tokens.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_role_session_name': {
                          'description': 'The session name for the temporary credentials when assuming the IAM role.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'gcp_service_account_json': {
                          'description': 'GCP Service Account JSON to be used for authentication when `auth_provider` is set to `gcp`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_id': {
                          'description': 'Azure Client ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_secret': {
                          'description': 'Azure Client Secret to be used for authentication when `auth_provider` is set to `azure`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_tenant_id': {
                          'description': 'Azure Tenant ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'encrypted': true,
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                    ],
                    'required': false,
                    'type': 'record',
                  },
                },
                {
                  'database': {
                    'default': 0,
                    'description': 'Database to use for the Redis connection when using the `redis` strategy',
                    'type': 'integer',
                  },
                },
                {
                  'ssl': {
                    'default': false,
                    'description': 'If set to true, uses SSL to connect to Redis.',
                    'required': false,
                    'type': 'boolean',
                  },
                },
                {
                  'ssl_verify': {
                    'default': false,
                    'description': 'If set to true, verifies the validity of the server SSL certificate. If setting this parameter, also configure `lua_ssl_trusted_certificate` in `kong.conf` to specify the CA (or server) certificate used by your Redis server. You may also need to configure `lua_ssl_verify_depth` accordingly.',
                    'required': false,
                    'type': 'boolean',
                  },
                },
                {
                  'server_name': {
                    'description': 'A string representing an SNI (server name indication) value for TLS.',
                    'referenceable': true,
                    'required': false,
                    'type': 'string',
                  },
                },
              ],
              'required': true,
              'type': 'record',
            },
          },
          {
            'hide_client_headers': {
              'default': false,
              'description': 'Optionally hide informative response headers.',
              'required': true,
              'type': 'boolean',
            },
          },
          {
            'error_code': {
              'default': 429,
              'description': 'Set a custom error code to return when the rate limit is exceeded.',
              'gt': 0,
              'type': 'number',
            },
          },
          {
            'error_message': {
              'default': 'API rate limit exceeded',
              'description': 'Set a custom error message to return when the rate limit is exceeded.',
              'type': 'string',
            },
          },
          {
            'sync_rate': {
              'default': -1,
              'description': 'How often to sync counter data to the central data store. A value of -1 results in synchronous behavior.',
              'required': true,
              'type': 'number',
            },
          },
        ],
        'required': true,
        'shorthand_fields': [
          {
            'redis_host': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_host is deprecated, please use config.redis.host instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'host',
                    ],
                  },
                ],
              },
              'type': 'string',
            },
          },
          {
            'redis_port': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_port is deprecated, please use config.redis.port instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'port',
                    ],
                  },
                ],
              },
              'type': 'integer',
            },
          },
          {
            'redis_password': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_password is deprecated, please use config.redis.password instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'password',
                    ],
                  },
                ],
              },
              'len_min': 0,
              'type': 'string',
            },
          },
          {
            'redis_username': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_username is deprecated, please use config.redis.username instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'username',
                    ],
                  },
                ],
              },
              'type': 'string',
            },
          },
          {
            'redis_ssl': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_ssl is deprecated, please use config.redis.ssl instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'ssl',
                    ],
                  },
                ],
              },
              'type': 'boolean',
            },
          },
          {
            'redis_ssl_verify': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_ssl_verify is deprecated, please use config.redis.ssl_verify instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'ssl_verify',
                    ],
                  },
                ],
              },
              'type': 'boolean',
            },
          },
          {
            'redis_server_name': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_server_name is deprecated, please use config.redis.server_name instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'server_name',
                    ],
                  },
                ],
              },
              'type': 'string',
            },
          },
          {
            'redis_timeout': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_timeout is deprecated, please use config.redis.timeout instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'timeout',
                    ],
                  },
                ],
              },
              'type': 'integer',
            },
          },
          {
            'redis_database': {
              'deprecation': {
                'message': 'rate-limiting: config.redis_database is deprecated, please use config.redis.database instead',
                'removal_in_version': '4.0',
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'database',
                    ],
                  },
                ],
              },
              'type': 'integer',
            },
          },
        ],
        'type': 'record',
      },
    },
  ],
  'supported_partials': {
    'redis-ce': [
      'config.redis',
    ],
  },
}
