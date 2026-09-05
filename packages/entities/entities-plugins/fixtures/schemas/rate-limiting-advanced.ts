export default {
  'entity_checks': [
    {
      'custom_entity_check': {
        'field_sources': [
          'config',
          'expressions',
        ],
        'run_with_missing_fields': true,
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
            'identifier': {
              'default': 'consumer',
              'description': 'The type of identifier used to generate the rate limit key. Defines the scope used to increment the rate limiting counters. Note if `identifier` is `consumer-group`, the plugin must be applied on a consumer group entity. Because a consumer may belong to multiple consumer groups, the plugin needs to know explicitly which consumer group to limit the rate.',
              'one_of': [
                'ip',
                'credential',
                'consumer',
                'service',
                'route',
                'header',
                'path',
                'consumer-group',
                'principal',
              ],
              'required': true,
              'type': 'string',
            },
          },
          {
            'compound_identifier': {
              'description': 'Similar to `identifer`, but supports combining multiple items. The priority of `compound_identifier` is higher than `identifier`, which means if `compound_identifer` is set, it will be used, otherwise `identifier` will be used.',
              'elements': {
                'one_of': [
                  'ip',
                  'credential',
                  'consumer',
                  'service',
                  'route',
                  'header',
                  'path',
                  'consumer-group',
                  'principal',
                ],
                'type': 'string',
              },
              'type': 'array',
            },
          },
          {
            'counter_key': {
              'description': 'The key used to identify the counter for rate limiting. This can be based on consumer attributes such as `consumer.id`, `consumer.username`, or `consumer.custom_id`. Only applicable when `identifier` is set to `consumer`.',
              'one_of': [
                'consumer.id',
                'consumer.username',
                'consumer.custom_id',
              ],
              'required': false,
              'type': 'string',
            },
          },
          {
            'custom_key': {
              'description': 'Overrides the computed rate-limiting key with a literal value for this request, regardless of `identifier` or `compound_identifier`.',
              'expressible': true,
              'len_min': 1,
              'required': false,
              'type': 'string',
            },
          },
          {
            'window_size': {
              'description': 'One or more window sizes to apply a limit to (defined in seconds). There must be a matching number of window limits and sizes specified.',
              'elements': {
                'type': 'number',
              },
              'required': true,
              'type': 'array',
            },
          },
          {
            'window_type': {
              'default': 'sliding',
              'description': "Sets the time window type to either `sliding` (default) or `fixed`. Sliding windows apply the rate limiting logic while taking into account previous hit rates (from the window that immediately precedes the current) using a dynamic weight. Fixed windows consist of buckets that are statically assigned to a definitive time range, each request is mapped to only one fixed window based on its timestamp and will affect only that window's counters.",
              'one_of': [
                'fixed',
                'sliding',
              ],
              'type': 'string',
            },
          },
          {
            'limit': {
              'description': 'One or more requests-per-window limits to apply. There must be a matching number of window limits and sizes specified.',
              'elements': {
                'type': 'number',
              },
              'expressible': true,
              'required': true,
              'type': 'array',
            },
          },
          {
            'sync_rate': {
              'description': 'How often to sync counter data to the central data store. A value of 0 results in synchronous behavior; a value of -1 ignores sync behavior entirely and only stores counters in node memory. A value greater than 0 will sync the counters in the specified number of seconds. The minimum allowed interval is 0.02 seconds (20ms).',
              'type': 'number',
            },
          },
          {
            'namespace': {
              'auto': true,
              'description': 'Specifies the rate-limiting namespace for this plugin instance. A namespace acts as a logical grouping for configuration and counter data used by the rate-limiting algorithm. Namespaces define how and where counter data is stored and synchronized. When multiple plugin instances share the same namespace, they also share the same rate-limiting counters and synchronization configuration. Conversely, using different namespaces ensures that each plugin instance maintains its own independent counters.',
              'required': true,
              'type': 'string',
            },
          },
          {
            'strategy': {
              'default': 'local',
              'description': 'The rate-limiting strategy to use for retrieving and incrementing the limits. Available values are: `local`, `redis` and `cluster`.',
              'one_of': [
                'cluster',
                'redis',
                'local',
              ],
              'required': true,
              'type': 'string',
            },
          },
          {
            'dictionary_name': {
              'default': 'kong_rate_limiting_counters',
              'description': "The shared dictionary where counters are stored. When the plugin is configured to synchronize counter data externally (that is `config.strategy` is `cluster` or `redis` and `config.sync_rate` isn't `-1`), this dictionary serves as a buffer to populate counters in the data store on each synchronization cycle.",
              'required': true,
              'type': 'string',
            },
          },
          {
            'lock_dictionary_name': {
              'default': 'kong_locks',
              'description': 'The shared dictionary where concurrency control locks are stored. The default shared dictionary is `kong_locks`. The shared dictionary should be declare in nginx-kong.conf.',
              'required': true,
              'type': 'string',
            },
          },
          {
            'hide_client_headers': {
              'default': false,
              'description': 'Optionally hide informative response headers that would otherwise provide information about the current status of limits and counters.',
              'type': 'boolean',
            },
          },
          {
            'retry_after_jitter_max': {
              'default': 0,
              'description': 'The upper bound of a jitter (random delay) in seconds to be added to the `Retry-After` header of denied requests (status = `429`) in order to prevent all the clients from coming back at the same time. The lower bound of the jitter is `0`; in this case, the `Retry-After` header is equal to the `RateLimit-Reset` header.',
              'type': 'number',
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
            'redis': {
              'entity_checks': [
                {
                  'mutually_required': [
                    'host',
                    'port',
                  ],
                },
                {
                  'mutually_required': [
                    'sentinel_master',
                    'sentinel_role',
                    'sentinel_nodes',
                  ],
                },
                {
                  'mutually_required': [
                    'connect_timeout',
                    'send_timeout',
                    'read_timeout',
                  ],
                },
                {
                  'conditional': {
                    'if_field': 'connection_is_proxied',
                    'if_match': {
                      'eq': true,
                    },
                    'then_field': 'host',
                    'then_match': {
                      'required': true,
                    },
                  },
                },
                {
                  'custom_entity_check': {
                    'field_sources': [
                      'database',
                      'connection_is_proxied',
                    ],
                    'run_with_missing_fields': true,
                  },
                },
                {
                  'custom_entity_check': {
                    'field_sources': [
                      'cluster_nodes',
                      'connection_is_proxied',
                    ],
                    'run_with_missing_fields': true,
                  },
                },
                {
                  'custom_entity_check': {
                    'field_sources': [
                      'sentinel_role',
                      'connection_is_proxied',
                    ],
                    'run_with_missing_fields': true,
                  },
                },
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
                    'default': '127.0.0.1',
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
                  'connect_timeout': {
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
                  'send_timeout': {
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
                  'read_timeout': {
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
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'sentinel_username': {
                    'description': "Sentinel username to authenticate with a Redis Sentinel instance. If undefined, ACL authentication won't be performed. This requires Redis v6.2.0+.",
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'sentinel_password': {
                    'description': 'Sentinel password to authenticate with a Redis Sentinel instance. If undefined, no AUTH commands are sent to Redis Sentinels.',
                    'encrypted': true,
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
                      {
                        'custom_entity_check': {
                          'field_sources': [
                            'auth_provider',
                            'oauth',
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
                            'oauth',
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
                      {
                        'oauth': {
                          'description': 'OAuth 2.0 client configuration used to authenticate to Redis when `auth_provider` is set to `oauth`.',
                          'fields': [
                            {
                              'token_endpoint': {
                                'description': 'OAuth 2.0 token endpoint URL used to request access tokens.',
                                'type': 'string',
                              },
                            },
                            {
                              'grant_type': {
                                'default': 'client_credentials',
                                'description': 'OAuth 2.0 grant type used to request access tokens.',
                                'one_of': [
                                  'client_credentials',
                                  'password',
                                ],
                                'type': 'string',
                              },
                            },
                            {
                              'auth_method': {
                                'default': 'client_secret_post',
                                'description': 'Client authentication method used against the token endpoint.',
                                'one_of': [
                                  'client_secret_post',
                                  'client_secret_basic',
                                  'client_secret_jwt',
                                ],
                                'type': 'string',
                              },
                            },
                            {
                              'client_secret_jwt_alg': {
                                'default': 'HS512',
                                'description': 'Signing algorithm used for `client_secret_jwt` client authentication.',
                                'one_of': [
                                  'HS256',
                                  'HS512',
                                ],
                                'type': 'string',
                              },
                            },
                            {
                              'client_id': {
                                'description': 'OAuth 2.0 client ID.',
                                'referenceable': true,
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'client_secret': {
                                'description': 'OAuth 2.0 client secret.',
                                'encrypted': true,
                                'referenceable': true,
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'username': {
                                'description': 'Resource owner username, used with the `password` grant type.',
                                'referenceable': true,
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'password': {
                                'description': 'Resource owner password, used with the `password` grant type.',
                                'encrypted': true,
                                'referenceable': true,
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'scopes': {
                                'default': [],
                                'description': 'OAuth 2.0 scopes to request.',
                                'elements': {
                                  'type': 'string',
                                },
                                'required': false,
                                'type': 'array',
                              },
                            },
                            {
                              'token_headers': {
                                'description': 'Additional HTTP headers to send with the token request.',
                                'keys': {
                                  'type': 'string',
                                },
                                'required': false,
                                'type': 'map',
                                'values': {
                                  'type': 'string',
                                },
                              },
                            },
                            {
                              'token_post_args': {
                                'description': 'Additional POST body arguments to send with the token request.',
                                'keys': {
                                  'type': 'string',
                                },
                                'required': false,
                                'type': 'map',
                                'values': {
                                  'type': 'string',
                                },
                              },
                            },
                            {
                              'redis_username': {
                                'description': 'Static Redis ACL username sent with `AUTH <username> <token>`.',
                                'referenceable': true,
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'redis_username_claim': {
                                'description': 'JWT claim in the access token used to derive the Redis ACL username (for example, `oid` for Microsoft Entra ID).',
                                'required': false,
                                'type': 'string',
                              },
                            },
                            {
                              'ssl_verify': {
                                'default': true,
                                'description': 'Whether to verify the TLS certificate of the token endpoint.',
                                'type': 'boolean',
                              },
                            },
                            {
                              'timeout': {
                                'default': 10000,
                                'description': 'Timeout, in milliseconds, for requests to the token endpoint.',
                                'type': 'number',
                              },
                            },
                          ],
                          'required': false,
                          'type': 'record',
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
                  'keepalive_pool_size': {
                    'between': [
                      1,
                      2147483646,
                    ],
                    'default': 256,
                    'description': "The size limit for every cosocket connection pool associated with every remote server, per worker process. If neither `keepalive_pool_size` nor `keepalive_backlog` is specified, no pool is created. If `keepalive_pool_size` isn't specified but `keepalive_backlog` is specified, then the pool uses the default value. Try to increase (e.g. 512) this value if latency is high or throughput is low.",
                    'type': 'integer',
                  },
                },
                {
                  'keepalive_backlog': {
                    'between': [
                      0,
                      2147483646,
                    ],
                    'description': 'Limits the total number of opened connections for a pool. If the connection pool is full, connection queues above the limit go into the backlog queue. If the backlog queue is full, subsequent connect operations fail and return `nil`. Queued operations (subject to set timeouts) resume once the number of connections in the pool is less than `keepalive_pool_size`. If latency is high or throughput is low, try increasing this value. Empirically, this value is larger than `keepalive_pool_size`.',
                    'type': 'integer',
                  },
                },
                {
                  'sentinel_master': {
                    'description': 'Sentinel master to use for Redis connections. Defining this value implies using Redis Sentinel.',
                    'type': 'string',
                  },
                },
                {
                  'sentinel_role': {
                    'description': 'Sentinel role to use for Redis connections when the `redis` strategy is defined. Defining this value implies using Redis Sentinel.',
                    'one_of': [
                      'master',
                      'slave',
                      'any',
                    ],
                    'type': 'string',
                  },
                },
                {
                  'sentinel_nodes': {
                    'description': 'Sentinel node addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Sentinel. The minimum length of the array is 1 element.',
                    'elements': {
                      'fields': [
                        {
                          'host': {
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'required': true,
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
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'type': 'array',
                  },
                },
                {
                  'cluster_nodes': {
                    'description': 'Cluster addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Cluster. The minimum length of the array is 1 element.',
                    'elements': {
                      'fields': [
                        {
                          'ip': {
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'required': true,
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
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'type': 'array',
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
                {
                  'cluster_max_redirections': {
                    'default': 5,
                    'description': 'Maximum retry attempts for redirection.',
                    'required': false,
                    'type': 'integer',
                  },
                },
                {
                  'connection_is_proxied': {
                    'default': false,
                    'description': 'If the connection to Redis is proxied (e.g. Envoy), set it `true`. Set the `host` and `port` to point to the proxy address.',
                    'required': false,
                    'type': 'boolean',
                  },
                },
                {
                  'redis_proxy_type': {
                    'description': 'If the `connection_is_proxied` is enabled, this field indicates the proxy type and version you are using. For example, you can enable this optioin when you want authentication between Kong and Envoy proxy.',
                    'one_of': [
                      'envoy_v1.31',
                    ],
                    'required': false,
                    'type': 'string',
                  },
                },
              ],
              'required': true,
              'shorthand_fields': [
                {
                  'timeout': {
                    'deprecation': {
                      'message': 'redis schema field `timeout` is deprecated, use `connect_timeout`, `send_timeout` and `read_timeout`',
                      'removal_in_version': '4.0',
                      'replaced_with': [
                        {
                          'path': [
                            'connect_timeout',
                          ],
                        },
                        {
                          'path': [
                            'send_timeout',
                          ],
                        },
                        {
                          'path': [
                            'read_timeout',
                          ],
                        },
                      ],
                    },
                    'type': 'integer',
                  },
                },
                {
                  'sentinel_addresses': {
                    'deprecation': {
                      'message': 'sentinel_addresses is deprecated, please use sentinel_nodes instead',
                      'removal_in_version': '4.0',
                      'replaced_with': [
                        {
                          'path': [
                            'sentinel_nodes',
                          ],
                        },
                      ],
                    },
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'type': 'array',
                  },
                },
                {
                  'cluster_addresses': {
                    'deprecation': {
                      'message': 'cluster_addresses is deprecated, please use cluster_nodes instead',
                      'removal_in_version': '4.0',
                      'replaced_with': [
                        {
                          'path': [
                            'cluster_nodes',
                          ],
                        },
                      ],
                    },
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'type': 'array',
                  },
                },
              ],
              'type': 'record',
            },
          },
          {
            'throttling': {
              'fields': [
                {
                  'enabled': {
                    'default': false,
                    'description': 'Determines if the throttling feature is enabled or not',
                    'required': true,
                    'type': 'boolean',
                  },
                },
                {
                  'interval': {
                    'between': [
                      1,
                      1000000,
                    ],
                    'default': 5,
                    'description': 'The period between two successive retries for an individual request (in seconds)',
                    'required': true,
                    'type': 'number',
                  },
                },
                {
                  'retry_times': {
                    'between': [
                      1,
                      1000000,
                    ],
                    'default': 3,
                    'description': 'The maximum number of retries for an individual request',
                    'required': true,
                    'type': 'number',
                  },
                },
                {
                  'queue_limit': {
                    'between': [
                      1,
                      1000000,
                    ],
                    'default': 5,
                    'description': 'The maximum number of requests allowed for throttling',
                    'required': true,
                    'type': 'number',
                  },
                },
              ],
              'required': false,
              'type': 'record',
            },
          },
          {
            'enforce_consumer_groups': {
              'default': false,
              'description': 'Determines if consumer groups are allowed to override the rate limiting settings for the given Route or Service. Flipping `enforce_consumer_groups` from `true` to `false` disables the group override, but does not clear the list of consumer groups. You can then flip `enforce_consumer_groups` to `true` to re-enforce the groups.',
              'type': 'boolean',
            },
          },
          {
            'consumer_groups': {
              'description': 'List of consumer groups allowed to override the rate limiting settings for the given Route or Service. Required if `enforce_consumer_groups` is set to `true`.',
              'elements': {
                'type': 'string',
              },
              'type': 'array',
            },
          },
          {
            'disable_penalty': {
              'default': false,
              'description': "If set to `true`, this doesn't count denied requests (status = `429`). If set to `false`, all requests, including denied ones, are counted. This parameter only affects the `sliding` window_type.",
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
        ],
        'required': true,
        'type': 'record',
      },
    },
    {
      'expressions': {
        'fields': [
          {
            'custom_key': {
              'expressible_kong_type': 'string',
              'len_max': 1024,
              'len_min': 0,
              'source_field': {
                'description': 'Overrides the computed rate-limiting key with a literal value for this request, regardless of `identifier` or `compound_identifier`.',
                'expressible': true,
                'len_min': 1,
                'required': false,
                'type': 'string',
              },
              'type': 'string',
            },
          },
          {
            'limit': {
              'elements': {
                'expressible_kong_type': 'number',
                'len_max': 1024,
                'len_min': 0,
                'source_field': {
                  'type': 'number',
                },
                'type': 'string',
              },
              'type': 'array',
            },
          },
        ],
        'required': false,
        'type': 'record',
      },
    },
  ],
  'supported_partials': {
    'redis-ee': [
      'config.redis',
    ],
  },
}
