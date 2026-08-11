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
        'reference': 'consumers',
        'eq': null,
        'description': 'Custom type for representing a foreign key with a null value allowed.',
        'type': 'foreign',
      },
    },
    {
      'protocols': {
        'required': true,
        'default': [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        'elements': {
          'type': 'string',
          'one_of': [
            'grpc',
            'grpcs',
            'http',
            'https',
            'ws',
            'wss',
          ],
        },
        'type': 'set',
      },
    },
    {
      'consumer_group': {
        'reference': 'consumer_groups',
        'eq': null,
        'description': 'Custom type for representing a foreign key with a null value allowed.',
        'type': 'foreign',
      },
    },
    {
      'config': {
        'entity_checks': [
          {
            'mutually_exclusive': [
              'consumer_claims',
              'consumer_groups_claim',
            ],
          },
          {
            'mutually_exclusive': [
              'upstream_headers',
              'upstream_headers_claims',
            ],
          },
          {
            'mutually_exclusive': [
              'upstream_headers',
              'upstream_headers_names',
            ],
          },
          {
            'mutually_exclusive': [
              'downstream_headers',
              'downstream_headers_claims',
            ],
          },
          {
            'mutually_exclusive': [
              'downstream_headers',
              'downstream_headers_names',
            ],
          },
        ],
        'fields': [
          {
            'token_exchange': {
              'required': false,
              'description': 'Details on how to accept tokens from other identity providers.',
              'fields': [
                {
                  'subject_token_issuers': {
                    'elements': {
                      'required': false,
                      'fields': [
                        {
                          'issuer': {
                            'required': true,
                            'description': 'Tokens of whose iss claim matches this value will be exchanged.',
                            'type': 'string',
                          },
                        },
                        {
                          'jwks_uri': {
                            'required': false,
                            'description': 'An explicit JWKS endpoint for this issuer. This field should be left empty when this issuer is the same as the target issuer. It is only used when `verify_signature` is `true`. When set, Kong fetches the signing keys from this URI directly instead of using OIDC Discovery.',
                            'type': 'string',
                          },
                        },
                        {
                          'verify_signature': {
                            'required': false,
                            'default': false,
                            'description': 'When true, Kong cryptographically verifies the signature of the incoming subject token before exchanging it. This field should be left empty or set to `false` when this issuer is the same as the target issuer. Defaults to `false` for backward compatibility.',
                            'type': 'boolean',
                          },
                        },
                        {
                          'conditions': {
                            'required': false,
                            'description': 'A token will only be exchanged when it matches all these criteria. To exchange tokens issued by a different issuer, `conditions` must not be defined. In contrast, to exchange tokens issued by the target issuer itself, `conditions` must be defined.',
                            'fields': [
                              {
                                'has_audience': {
                                  'required': false,
                                  'elements': {
                                    'required': false,
                                    'type': 'string',
                                  },
                                  'type': 'array',
                                },
                              },
                              {
                                'missing_audience': {
                                  'required': false,
                                  'elements': {
                                    'required': false,
                                    'type': 'string',
                                  },
                                  'type': 'array',
                                },
                              },
                              {
                                'has_scopes': {
                                  'required': false,
                                  'elements': {
                                    'required': false,
                                    'type': 'string',
                                  },
                                  'type': 'array',
                                },
                              },
                              {
                                'missing_scopes': {
                                  'required': false,
                                  'elements': {
                                    'required': false,
                                    'type': 'string',
                                  },
                                  'type': 'array',
                                },
                              },
                            ],
                            'type': 'record',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': true,
                    'description': 'Trusted token issuers from which the upstream may accept tokens to be exchanged. If a JWT bearer matches all the conditions of a subject token issuer item, the token will be exchanged.',
                    'type': 'array',
                  },
                },
                {
                  'request': {
                    'entity_checks': [
                      {
                        'conditional': {
                          'if_match': {
                            'eq': true,
                          },
                          'then_field': 'scopes',
                          'if_field': 'empty_scopes',
                          'then_match': {
                            'len_max': 0,
                          },
                          'then_err': 'scopes should not be set when using empty_scopes',
                        },
                      },
                      {
                        'conditional': {
                          'if_match': {
                            'eq': true,
                          },
                          'then_field': 'audience',
                          'if_field': 'empty_audience',
                          'then_match': {
                            'len_max': 0,
                          },
                          'then_err': 'audience should not be set when using empty_audience',
                        },
                      },
                    ],
                    'fields': [
                      {
                        'scopes': {
                          'elements': {
                            'type': 'string',
                          },
                          'description': 'Scopes used in the token exchange request. Values defined here override those defined in `config.scopes`.',
                          'required': false,
                          'type': 'array',
                        },
                      },
                      {
                        'empty_scopes': {
                          'required': false,
                          'default': false,
                          'description': 'Use empty scopes. Use this field to remove scopes defined in `config.scopes`.',
                          'type': 'boolean',
                        },
                      },
                      {
                        'audience': {
                          'elements': {
                            'type': 'string',
                          },
                          'description': 'Audiences used in the token exchange request. Values defined here override those defined in `config.audience`.',
                          'required': false,
                          'type': 'array',
                        },
                      },
                      {
                        'empty_audience': {
                          'required': false,
                          'default': false,
                          'description': 'Use empty audiences. Use this field to remove audiences defined in `config.audience`.',
                          'type': 'boolean',
                        },
                      },
                    ],
                    'required': false,
                    'description': 'Parameters used in the token exchange request.',
                    'type': 'record',
                  },
                },
                {
                  'cache': {
                    'required': false,
                    'description': 'Cache support for token exchange',
                    'fields': [
                      {
                        'enabled': {
                          'required': false,
                          'default': true,
                          'description': 'Whether to enable caching.',
                          'type': 'boolean',
                        },
                      },
                      {
                        'ttl': {
                          'required': false,
                          'description': 'Cache ttl in seconds used when caching exchanged tokens, use it to override `conf.cache_ttl`. Token expiry will be used if shorter than this value.',
                          'gt': 0,
                          'type': 'integer',
                        },
                      },
                    ],
                    'type': 'record',
                  },
                },
              ],
              'type': 'record',
            },
          },
          {
            'issuer': {
              'required': true,
              'description': 'The discovery endpoint (or the issuer identifier). When there is no discovery endpoint, please also configure `config.using_pseudo_issuer=true`.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'using_pseudo_issuer': {
              'required': false,
              'default': false,
              'description': 'If the plugin uses a pseudo issuer. When set to true, the plugin will not discover the configuration from the issuer URL specified with `config.issuer`.',
              'type': 'boolean',
            },
          },
          {
            'discovery_headers_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header names passed to the discovery endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'discovery_headers_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header values passed to the discovery endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'extra_jwks_uris': {
              'elements': {
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
                'referenceable': true,
                'type': 'string',
              },
              'description': 'JWKS URIs whose public keys are trusted (in addition to the keys found with the discovery).',
              'required': false,
              'type': 'set',
            },
          },
          {
            'jwks_endpoint': {
              'required': false,
              'description': 'Overrides the `jwks_uri` returned by discovery. Use when the IdP exposes a non-standard JWKS endpoint.',
              'type': 'string',
            },
          },
          {
            'rediscovery_lifetime': {
              'required': false,
              'default': 30,
              'description': 'Specifies how long (in seconds) the plugin waits between discovery attempts. Discovery is still triggered on an as-needed basis.',
              'type': 'number',
            },
          },
          {
            'auth_methods': {
              'elements': {
                'one_of': [
                  'password',
                  'client_credentials',
                  'authorization_code',
                  'bearer',
                  'introspection',
                  'userinfo',
                  'kong_oauth2',
                  'refresh_token',
                  'session',
                ],
                'type': 'string',
              },
              'default': [
                'password',
                'client_credentials',
                'authorization_code',
                'bearer',
                'introspection',
                'userinfo',
                'kong_oauth2',
                'refresh_token',
                'session',
              ],
              'required': false,
              'description': 'Types of credentials/grants to enable.',
              'type': 'array',
            },
          },
          {
            'client_id': {
              'elements': {
                'referenceable': true,
                'type': 'string',
              },
              'required': false,
              'description': 'The client id(s) that the plugin uses when it calls authenticated endpoints on the identity provider.',
              'encrypted': true,
              'type': 'array',
            },
          },
          {
            'client_secret': {
              'elements': {
                'referenceable': true,
                'type': 'string',
              },
              'required': false,
              'description': 'The client secret.',
              'encrypted': true,
              'type': 'array',
            },
          },
          {
            'client_auth': {
              'elements': {
                'one_of': [
                  'client_secret_basic',
                  'client_secret_post',
                  'client_secret_jwt',
                  'private_key_jwt',
                  'tls_client_auth',
                  'self_signed_tls_client_auth',
                  'none',
                ],
                'type': 'string',
              },
              'description': "The default OpenID Connect client authentication method is 'client_secret_basic' (using 'Authorization: Basic' header), 'client_secret_post' (credentials in body), 'client_secret_jwt' (signed client assertion in body), 'private_key_jwt' (private key-signed assertion), 'tls_client_auth' (client certificate), 'self_signed_tls_client_auth' (self-signed client certificate), and 'none' (no authentication).",
              'required': false,
              'type': 'array',
            },
          },
          {
            'client_jwk': {
              'elements': {
                'required': false,
                'fields': [
                  {
                    'issuer': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'kty': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'use': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'key_ops': {
                      'required': false,
                      'elements': {
                        'required': false,
                        'type': 'string',
                      },
                      'type': 'array',
                    },
                  },
                  {
                    'alg': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'kid': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'x5u': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'x5c': {
                      'required': false,
                      'elements': {
                        'required': false,
                        'type': 'string',
                      },
                      'type': 'array',
                    },
                  },
                  {
                    'x5t': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'x5t#S256': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'k': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'x': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'y': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'crv': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'n': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'e': {
                      'required': false,
                      'type': 'string',
                    },
                  },
                  {
                    'd': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'p': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'q': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'dp': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'dq': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'qi': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'oth': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    'r': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                  {
                    't': {
                      'required': false,
                      'referenceable': true,
                      'encrypted': true,
                      'type': 'string',
                    },
                  },
                ],
                'type': 'record',
              },
              'description': 'The JWK used for the private_key_jwt authentication.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'client_alg': {
              'elements': {
                'one_of': [
                  'HS256',
                  'HS384',
                  'HS512',
                  'RS256',
                  'RS384',
                  'RS512',
                  'ES256',
                  'ES384',
                  'ES512',
                  'PS256',
                  'PS384',
                  'PS512',
                  'EdDSA',
                ],
                'type': 'string',
              },
              'description': 'The algorithm to use for client_secret_jwt (only HS***) or private_key_jwt authentication.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'client_arg': {
              'required': false,
              'default': 'client_id',
              'description': 'The client to use for this request (the selection is made with a request parameter with the same name).',
              'type': 'string',
            },
          },
          {
            'redirect_uri': {
              'elements': {
                'type': 'string',
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              },
              'description': 'The redirect URI passed to the authorization and token endpoints.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'login_redirect_uri': {
              'elements': {
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
                'referenceable': true,
                'type': 'string',
              },
              'description': 'Where to redirect the client when `login_action` is set to `redirect`.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'logout_redirect_uri': {
              'elements': {
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
                'referenceable': true,
                'type': 'string',
              },
              'description': 'Where to redirect the client after the logout.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'forbidden_redirect_uri': {
              'elements': {
                'type': 'string',
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              },
              'description': 'Where to redirect the client on forbidden requests.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'forbidden_error_message': {
              'required': false,
              'default': 'Forbidden',
              'description': 'The error message for the forbidden requests (when not using the redirection).',
              'type': 'string',
            },
          },
          {
            'forbidden_destroy_session': {
              'required': false,
              'default': true,
              'description': 'Destroy any active session for the forbidden requests.',
              'type': 'boolean',
            },
          },
          {
            'unauthorized_destroy_session': {
              'required': false,
              'default': true,
              'description': 'Destroy any active session for the unauthorized requests.',
              'type': 'boolean',
            },
          },
          {
            'unauthorized_redirect_uri': {
              'elements': {
                'type': 'string',
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              },
              'description': 'Where to redirect the client on unauthorized requests.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'unauthorized_error_message': {
              'required': false,
              'default': 'Unauthorized',
              'description': 'The error message for the unauthorized requests (when not using the redirection).',
              'type': 'string',
            },
          },
          {
            'unexpected_redirect_uri': {
              'elements': {
                'type': 'string',
                'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
              },
              'description': 'Where to redirect the client when unexpected errors happen with the requests.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'response_mode': {
              'default': 'query',
              'required': false,
              'description': 'Response mode passed to the authorization endpoint: - `query`: for parameters in query string - `form_post`: for parameters in request body - `fragment`: for parameters in uri fragment (rarely useful as the plugin itself cannot read it) - `query.jwt`, `form_post.jwt`, `fragment.jwt`: similar to `query`, `form_post` and `fragment` but the parameters are encoded in a JWT - `jwt`: shortcut that indicates the default encoding for the requested response type.',
              'type': 'string',
              'one_of': [
                'query',
                'form_post',
                'fragment',
                'query.jwt',
                'form_post.jwt',
                'fragment.jwt',
                'jwt',
              ],
            },
          },
          {
            'response_type': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'code',
              ],
              'required': false,
              'description': 'The response type passed to the authorization endpoint.',
              'type': 'array',
            },
          },
          {
            'scopes': {
              'elements': {
                'referenceable': true,
                'type': 'string',
              },
              'default': [
                'openid',
              ],
              'required': false,
              'description': 'The scopes passed to the authorization and token endpoints.',
              'type': 'array',
            },
          },
          {
            'audience': {
              'elements': {
                'type': 'string',
              },
              'description': 'The audience passed to the authorization endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'issuers_allowed': {
              'elements': {
                'referenceable': true,
                'type': 'string',
              },
              'description': 'The issuers allowed to be present in the tokens (`iss` claim).',
              'required': false,
              'type': 'array',
            },
          },
          {
            'scopes_required': {
              'elements': {
                'type': 'string',
              },
              'description': 'The scopes (`scopes_claim` claim) required to be present in the access token (or introspection results) for successful authorization. This config parameter works in both **AND** / **OR** cases.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'scopes_claim': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'scope',
              ],
              'required': false,
              'description': 'The claim that contains the scopes. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'type': 'array',
            },
          },
          {
            'audience_required': {
              'elements': {
                'type': 'string',
              },
              'description': 'The audiences (`audience_claim` claim) required to be present in the access token (or introspection results) for successful authorization. This config parameter works in both **AND** / **OR** cases.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'audience_claim': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'aud',
              ],
              'required': false,
              'description': 'The claim that contains the audience. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'type': 'array',
            },
          },
          {
            'groups_required': {
              'elements': {
                'type': 'string',
              },
              'description': 'The groups (`groups_claim` claim) required to be present in the access token (or introspection results) for successful authorization. This config parameter works in both **AND** / **OR** cases.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'groups_claim': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'groups',
              ],
              'required': false,
              'description': 'The claim that contains the groups. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'type': 'array',
            },
          },
          {
            'roles_required': {
              'elements': {
                'type': 'string',
              },
              'description': 'The roles (`roles_claim` claim) required to be present in the access token (or introspection results) for successful authorization. This config parameter works in both **AND** / **OR** cases.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'roles_claim': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'roles',
              ],
              'required': false,
              'description': 'The claim that contains the roles. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'type': 'array',
            },
          },
          {
            'domains': {
              'elements': {
                'type': 'string',
              },
              'description': 'The allowed values for the `hd` claim.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'max_age': {
              'required': false,
              'description': 'The maximum age (in seconds) compared to the `auth_time` claim.',
              'type': 'number',
            },
          },
          {
            'authenticated_groups_claim': {
              'elements': {
                'type': 'string',
              },
              'description': 'The claim that contains authenticated groups. This setting can be used together with ACL plugin, but it also enables IdP managed groups with other applications and integrations. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'pushed_authorization_request_endpoint': {
              'required': false,
              'description': 'The pushed authorization endpoint. If set it overrides the value in `pushed_authorization_request_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'pushed_authorization_request_endpoint_auth_method': {
              'required': false,
              'description': 'The pushed authorization request endpoint authentication method: `client_secret_basic`, `client_secret_post`, `client_secret_jwt`, `private_key_jwt`, `tls_client_auth`, `self_signed_tls_client_auth`, or `none`: do not authenticate',
              'one_of': [
                'client_secret_basic',
                'client_secret_post',
                'client_secret_jwt',
                'private_key_jwt',
                'tls_client_auth',
                'self_signed_tls_client_auth',
                'none',
              ],
              'type': 'string',
            },
          },
          {
            'require_pushed_authorization_requests': {
              'required': false,
              'description': 'Forcibly enable or disable the pushed authorization requests. When not set the value is determined through the discovery using the value of `require_pushed_authorization_requests` (which defaults to `false`).',
              'type': 'boolean',
            },
          },
          {
            'require_proof_key_for_code_exchange': {
              'required': false,
              'description': 'Forcibly enable or disable the proof key for code exchange. When not set the value is determined through the discovery using the value of `code_challenge_methods_supported`, and enabled automatically (in case the `code_challenge_methods_supported` is missing, the PKCE will not be enabled).',
              'type': 'boolean',
            },
          },
          {
            'require_signed_request_object': {
              'required': false,
              'description': 'Forcibly enable or disable the usage of signed request object on authorization or pushed authorization endpoint. When not set the value is determined through the discovery using the value of `require_signed_request_object`, and enabled automatically (in case the `require_signed_request_object` is missing, the feature will not be enabled).',
              'type': 'boolean',
            },
          },
          {
            'authorization_endpoint': {
              'required': false,
              'description': 'The authorization endpoint. If set it overrides the value in `authorization_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'authorization_query_args_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query argument names passed to the authorization endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'authorization_query_args_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query argument values passed to the authorization endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'authorization_query_args_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query arguments passed from the client to the authorization endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'authorization_rolling_timeout': {
              'required': false,
              'default': 600,
              'description': 'Specifies how long the session used for the authorization code flow can be used in seconds until it needs to be renewed. 0 disables the checks and rolling.',
              'type': 'number',
            },
          },
          {
            'authorization_cookie_name': {
              'required': false,
              'default': 'authorization',
              'description': 'The authorization cookie name.',
              'type': 'string',
            },
          },
          {
            'authorization_cookie_path': {
              'match_none': [
                {
                  'pattern': '//',
                  'err': 'must not have empty segments',
                },
              ],
              'default': '/',
              'required': false,
              'description': 'The authorization cookie Path flag.',
              'starts_with': '/',
              'type': 'string',
            },
          },
          {
            'authorization_cookie_domain': {
              'required': false,
              'description': 'The authorization cookie Domain flag.',
              'type': 'string',
            },
          },
          {
            'authorization_cookie_same_site': {
              'default': 'Default',
              'required': false,
              'description': 'Controls whether a cookie is sent with cross-origin requests, providing some protection against cross-site request forgery attacks.',
              'type': 'string',
              'one_of': [
                'Strict',
                'Lax',
                'None',
                'Default',
              ],
            },
          },
          {
            'authorization_cookie_http_only': {
              'required': false,
              'default': true,
              'description': 'Forbids JavaScript from accessing the cookie, for example, through the `Document.cookie` property.',
              'type': 'boolean',
            },
          },
          {
            'authorization_cookie_secure': {
              'required': false,
              'description': 'Cookie is only sent to the server when a request is made with the https: scheme (except on localhost), and therefore is more resistant to man-in-the-middle attacks.',
              'type': 'boolean',
            },
          },
          {
            'preserve_query_args': {
              'required': false,
              'default': false,
              'description': 'With this parameter, you can preserve request query arguments even when doing authorization code flow.',
              'type': 'boolean',
            },
          },
          {
            'token_endpoint': {
              'required': false,
              'description': 'The token endpoint. If set it overrides the value in `token_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'token_endpoint_auth_method': {
              'required': false,
              'description': 'The token endpoint authentication method: `client_secret_basic`, `client_secret_post`, `client_secret_jwt`, `private_key_jwt`, `tls_client_auth`, `self_signed_tls_client_auth`, or `none`: do not authenticate',
              'one_of': [
                'client_secret_basic',
                'client_secret_post',
                'client_secret_jwt',
                'private_key_jwt',
                'tls_client_auth',
                'self_signed_tls_client_auth',
                'none',
              ],
              'type': 'string',
            },
          },
          {
            'token_headers_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header names passed to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_headers_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header values passed to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_headers_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra headers passed from the client to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_headers_replay': {
              'elements': {
                'type': 'string',
              },
              'description': 'The names of token endpoint response headers to forward to the downstream client.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_headers_prefix': {
              'required': false,
              'description': 'Add a prefix to the token endpoint response headers before forwarding them to the downstream client.',
              'type': 'string',
            },
          },
          {
            'token_headers_grants': {
              'elements': {
                'one_of': [
                  'password',
                  'client_credentials',
                  'authorization_code',
                  'refresh_token',
                ],
                'type': 'string',
              },
              'description': 'Enable the sending of the token endpoint response headers only with certain grants: - `password`: with OAuth password grant - `client_credentials`: with OAuth client credentials grant - `authorization_code`: with authorization code flow - `refresh_token` with refresh token grant.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_post_args_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post argument names passed to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_post_args_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post argument values passed to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_post_args_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Pass extra arguments from the client to the OpenID-Connect plugin. If arguments exist, the client can pass them using: - Query parameters - Request Body - Request Header  This parameter can be used with `scope` values, like this:  `config.token_post_args_client=scope`  In this case, the token would take the `scope` value from the query parameter or from the request body or from the header and send it to the token endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_endpoint': {
              'required': false,
              'description': 'The introspection endpoint. If set it overrides the value in `introspection_endpoint` returned by the discovery endpoint.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'introspection_endpoint_auth_method': {
              'required': false,
              'description': 'The introspection endpoint authentication method: : `client_secret_basic`, `client_secret_post`, `client_secret_jwt`, `private_key_jwt`, `tls_client_auth`, `self_signed_tls_client_auth`, or `none`: do not authenticate',
              'one_of': [
                'client_secret_basic',
                'client_secret_post',
                'client_secret_jwt',
                'private_key_jwt',
                'tls_client_auth',
                'self_signed_tls_client_auth',
                'none',
              ],
              'type': 'string',
            },
          },
          {
            'introspection_hint': {
              'required': false,
              'default': 'access_token',
              'description': 'Introspection hint parameter value passed to the introspection endpoint.',
              'type': 'string',
            },
          },
          {
            'introspection_check_active': {
              'required': false,
              'default': true,
              'description': 'Check that the introspection response has an `active` claim with a value of `true`.',
              'type': 'boolean',
            },
          },
          {
            'introspection_accept': {
              'default': 'application/json',
              'required': false,
              'description': 'The value of `Accept` header for introspection requests: - `application/json`: introspection response as JSON - `application/token-introspection+jwt`: introspection response as JWT (from the current IETF draft document) - `application/jwt`: introspection response as JWT (from the obsolete IETF draft document).',
              'type': 'string',
              'one_of': [
                'application/json',
                'application/token-introspection+jwt',
                'application/jwt',
              ],
            },
          },
          {
            'introspection_headers_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header names passed to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_headers_values': {
              'elements': {
                'referenceable': true,
                'type': 'string',
              },
              'required': false,
              'description': 'Extra header values passed to the introspection endpoint.',
              'encrypted': true,
              'type': 'array',
            },
          },
          {
            'introspection_headers_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra headers passed from the client to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_post_args_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post argument names passed to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_post_args_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post argument values passed to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_post_args_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post arguments passed from the client to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspection_post_args_client_headers': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra post arguments passed from the client headers to the introspection endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'introspect_jwt_tokens': {
              'required': false,
              'default': false,
              'description': 'Specifies whether to introspect the JWT access tokens (can be used to check for revocations).',
              'type': 'boolean',
            },
          },
          {
            'revocation_endpoint': {
              'required': false,
              'description': 'The revocation endpoint. If set it overrides the value in `revocation_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'revocation_endpoint_auth_method': {
              'required': false,
              'description': 'The revocation endpoint authentication method: : `client_secret_basic`, `client_secret_post`, `client_secret_jwt`, `private_key_jwt`, `tls_client_auth`, `self_signed_tls_client_auth`, or `none`: do not authenticate',
              'one_of': [
                'client_secret_basic',
                'client_secret_post',
                'client_secret_jwt',
                'private_key_jwt',
                'tls_client_auth',
                'self_signed_tls_client_auth',
                'none',
              ],
              'type': 'string',
            },
          },
          {
            'end_session_endpoint': {
              'required': false,
              'description': 'The end session endpoint. If set it overrides the value in `end_session_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'userinfo_endpoint': {
              'required': false,
              'description': 'The user info endpoint. If set it overrides the value in `userinfo_endpoint` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'userinfo_accept': {
              'default': 'application/json',
              'required': false,
              'description': 'The value of `Accept` header for user info requests: - `application/json`: user info response as JSON - `application/jwt`: user info response as JWT (from the obsolete IETF draft document).',
              'type': 'string',
              'one_of': [
                'application/json',
                'application/jwt',
              ],
            },
          },
          {
            'userinfo_headers_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header names passed to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'userinfo_headers_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra header values passed to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'userinfo_headers_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra headers passed from the client to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'userinfo_query_args_names': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query argument names passed to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'userinfo_query_args_values': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query argument values passed to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'userinfo_query_args_client': {
              'elements': {
                'type': 'string',
              },
              'description': 'Extra query arguments passed from the client to the user info endpoint.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'token_exchange_endpoint': {
              'required': false,
              'description': 'Endpoint used to perform the legacy token exchange.',
              'type': 'string',
            },
          },
          {
            'session_secret': {
              'referenceable': true,
              'required': false,
              'description': 'The session secret.',
              'encrypted': true,
              'type': 'string',
            },
          },
          {
            'session_audience': {
              'required': false,
              'default': 'default',
              'description': 'The session audience, which is the intended target application. For example `"my-application"`.',
              'type': 'string',
            },
          },
          {
            'session_cookie_name': {
              'required': false,
              'default': 'session',
              'description': 'The session cookie name.',
              'type': 'string',
            },
          },
          {
            'session_remember': {
              'required': false,
              'default': false,
              'description': 'Enables or disables persistent sessions.',
              'type': 'boolean',
            },
          },
          {
            'session_remember_cookie_name': {
              'required': false,
              'default': 'remember',
              'description': 'Persistent session cookie name. Use with the `remember` configuration parameter.',
              'type': 'string',
            },
          },
          {
            'session_remember_rolling_timeout': {
              'required': false,
              'default': 604800,
              'description': 'Specifies how long the persistent session is considered valid in seconds. 0 disables the checks and rolling.',
              'type': 'number',
            },
          },
          {
            'session_remember_absolute_timeout': {
              'required': false,
              'default': 2592000,
              'description': 'Limits how long the persistent session can be renewed in seconds, until re-authentication is required. 0 disables the checks.',
              'type': 'number',
            },
          },
          {
            'session_idling_timeout': {
              'required': false,
              'default': 900,
              'description': 'Specifies how long the session can be inactive until it is considered invalid in seconds. 0 disables the checks and touching.',
              'type': 'number',
            },
          },
          {
            'session_rolling_timeout': {
              'required': false,
              'default': 3600,
              'description': 'Specifies how long the session can be used in seconds until it needs to be renewed. 0 disables the checks and rolling.',
              'type': 'number',
            },
          },
          {
            'session_absolute_timeout': {
              'required': false,
              'default': 86400,
              'description': 'Limits how long the session can be renewed in seconds, until re-authentication is required. 0 disables the checks.',
              'type': 'number',
            },
          },
          {
            'session_cookie_path': {
              'match_none': [
                {
                  'pattern': '//',
                  'err': 'must not have empty segments',
                },
              ],
              'default': '/',
              'required': false,
              'description': 'The session cookie Path flag.',
              'starts_with': '/',
              'type': 'string',
            },
          },
          {
            'session_cookie_domain': {
              'required': false,
              'description': 'The session cookie Domain flag.',
              'type': 'string',
            },
          },
          {
            'session_cookie_same_site': {
              'default': 'Lax',
              'required': false,
              'description': 'Controls whether a cookie is sent with cross-origin requests, providing some protection against cross-site request forgery attacks.',
              'type': 'string',
              'one_of': [
                'Strict',
                'Lax',
                'None',
                'Default',
              ],
            },
          },
          {
            'session_cookie_http_only': {
              'required': false,
              'default': true,
              'description': 'Forbids JavaScript from accessing the cookie, for example, through the `Document.cookie` property.',
              'type': 'boolean',
            },
          },
          {
            'session_cookie_secure': {
              'required': false,
              'description': 'Cookie is only sent to the server when a request is made with the https: scheme (except on localhost), and therefore is more resistant to man-in-the-middle attacks.',
              'type': 'boolean',
            },
          },
          {
            'session_bind': {
              'elements': {
                'one_of': [
                  'ip',
                  'scheme',
                  'user-agent',
                ],
                'type': 'string',
              },
              'description': 'Bind the session to data acquired from the HTTP request or connection.',
              'type': 'set',
            },
          },
          {
            'session_request_headers': {
              'required': false,
              'description': 'Set of headers to send to upstream, use id, audience, subject, timeout, idling-timeout, rolling-timeout, absolute-timeout. E.g. `[ "id", "timeout" ]` will set Session-Id and Session-Timeout request headers.',
              'elements': {
                'one_of': [
                  'id',
                  'audience',
                  'subject',
                  'timeout',
                  'idling-timeout',
                  'rolling-timeout',
                  'absolute-timeout',
                ],
                'type': 'string',
              },
              'type': 'set',
            },
          },
          {
            'session_response_headers': {
              'required': false,
              'description': 'Set of headers to send to downstream, use id, audience, subject, timeout, idling-timeout, rolling-timeout, absolute-timeout. E.g. `[ "id", "timeout" ]` will set Session-Id and Session-Timeout response headers.',
              'elements': {
                'one_of': [
                  'id',
                  'audience',
                  'subject',
                  'timeout',
                  'idling-timeout',
                  'rolling-timeout',
                  'absolute-timeout',
                ],
                'type': 'string',
              },
              'type': 'set',
            },
          },
          {
            'session_storage': {
              'default': 'cookie',
              'required': false,
              'description': "The session storage for session data: - `cookie`: stores session data with the session cookie (the session cannot be invalidated or revoked without changing session secret, but is stateless, and doesn't require a database) - `memcache`: stores session data in memcached - `redis`: stores session data in Redis.",
              'type': 'string',
              'one_of': [
                'cookie',
                'memcache',
                'memcached',
                'redis',
              ],
            },
          },
          {
            'session_store_metadata': {
              'required': false,
              'default': false,
              'description': 'Configures whether or not session metadata should be stored. This metadata includes information about the active sessions for a specific audience belonging to a specific subject.',
              'type': 'boolean',
            },
          },
          {
            'session_enforce_same_subject': {
              'required': false,
              'default': false,
              'description': 'When set to `true`, audiences are forced to share the same subject.',
              'type': 'boolean',
            },
          },
          {
            'session_hash_subject': {
              'required': false,
              'default': false,
              'description': 'When set to `true`, the value of subject is hashed before being stored. Only applies when `session_store_metadata` is enabled.',
              'type': 'boolean',
            },
          },
          {
            'session_hash_storage_key': {
              'required': false,
              'default': false,
              'description': 'When set to `true`, the storage key (session ID) is hashed for extra security. Hashing the storage key means it is impossible to decrypt data from the storage without a cookie.',
              'type': 'boolean',
            },
          },
          {
            'session_memcached_prefix': {
              'required': false,
              'description': 'The memcached session key prefix.',
              'type': 'string',
            },
          },
          {
            'session_memcached_socket': {
              'required': false,
              'description': 'The memcached unix socket path.',
              'type': 'string',
            },
          },
          {
            'session_memcached_host': {
              'required': false,
              'default': '127.0.0.1',
              'description': 'The memcached host.',
              'type': 'string',
            },
          },
          {
            'session_memcached_port': {
              'default': 11211,
              'between': [
                0,
                65535,
              ],
              'required': false,
              'description': 'The memcached port.',
              'type': 'integer',
            },
          },
          {
            'session_memcached_ssl': {
              'required': false,
              'description': 'If set to true, uses SSL to connect to memcached',
              'type': 'boolean',
            },
          },
          {
            'session_memcached_ssl_verify': {
              'required': false,
              'default': true,
              'description': 'If set to true, verifies the validity of the memcached server SSL certificate',
              'type': 'boolean',
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
                    'then_field': 'host',
                    'if_field': 'connection_is_proxied',
                    'then_match': {
                      'required': true,
                    },
                    'if_match': {
                      'eq': true,
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
              'shorthand_fields': [
                {
                  'timeout': {
                    'type': 'integer',
                    'deprecation': {
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
                      'message': 'redis schema field `timeout` is deprecated, use `connect_timeout`, `send_timeout` and `read_timeout`',
                      'removal_in_version': '4.0',
                    },
                  },
                },
                {
                  'sentinel_addresses': {
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'deprecation': {
                      'replaced_with': [
                        {
                          'path': [
                            'sentinel_nodes',
                          ],
                        },
                      ],
                      'message': 'sentinel_addresses is deprecated, please use sentinel_nodes instead',
                      'removal_in_version': '4.0',
                    },
                    'type': 'array',
                  },
                },
                {
                  'cluster_addresses': {
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'deprecation': {
                      'replaced_with': [
                        {
                          'path': [
                            'cluster_nodes',
                          ],
                        },
                      ],
                      'message': 'cluster_addresses is deprecated, please use cluster_nodes instead',
                      'removal_in_version': '4.0',
                    },
                    'type': 'array',
                  },
                },
              ],
              'required': true,
              'fields': [
                {
                  'host': {
                    'default': '127.0.0.1',
                    'referenceable': true,
                    'description': 'A string representing a host name, such as example.com.',
                    'type': 'string',
                  },
                },
                {
                  'port': {
                    'default': 6379,
                    'between': [
                      0,
                      65535,
                    ],
                    'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                    'referenceable': true,
                    'type': 'integer',
                  },
                },
                {
                  'connect_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'send_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'read_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'username': {
                    'referenceable': true,
                    'description': "Username to use for Redis connections. If undefined, ACL authentication won't be performed. This requires Redis v6.0.0+. To be compatible with Redis v5.x.y, you can set it to `default`.",
                    'type': 'string',
                  },
                },
                {
                  'password': {
                    'encrypted': true,
                    'description': 'Password to use for Redis connections. If undefined, no AUTH commands are sent to Redis.',
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'sentinel_username': {
                    'referenceable': true,
                    'description': "Sentinel username to authenticate with a Redis Sentinel instance. If undefined, ACL authentication won't be performed. This requires Redis v6.2.0+.",
                    'type': 'string',
                  },
                },
                {
                  'sentinel_password': {
                    'encrypted': true,
                    'description': 'Sentinel password to authenticate with a Redis Sentinel instance. If undefined, no AUTH commands are sent to Redis Sentinels.',
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'cloud_authentication': {
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
                          'type': 'string',
                          'description': "Auth providers to be used to authenticate to a Cloud Provider's Redis instance.",
                          'referenceable': true,
                          'one_of': [
                            'aws',
                            'gcp',
                            'azure',
                          ],
                        },
                      },
                      {
                        'aws_cache_name': {
                          'referenceable': true,
                          'description': 'The name of the AWS Elasticache cluster when `auth_provider` is set to `aws`.',
                          'type': 'string',
                        },
                      },
                      {
                        'aws_region': {
                          'referenceable': true,
                          'description': 'The region of the AWS ElastiCache cluster when `auth_provider` is set to `aws`.',
                          'type': 'string',
                        },
                      },
                      {
                        'aws_is_serverless': {
                          'required': false,
                          'description': 'This flag specifies whether the cluster is serverless when auth_provider is set to `aws`.',
                          'default': true,
                          'type': 'boolean',
                        },
                      },
                      {
                        'aws_access_key_id': {
                          'encrypted': true,
                          'description': 'AWS Access Key ID to be used for authentication when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_secret_access_key': {
                          'encrypted': true,
                          'description': 'AWS Secret Access Key to be used for authentication when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_assume_role_arn': {
                          'encrypted': true,
                          'description': 'The ARN of the IAM role to assume for generating ElastiCache IAM authentication tokens.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_role_session_name': {
                          'encrypted': true,
                          'description': 'The session name for the temporary credentials when assuming the IAM role.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'gcp_service_account_json': {
                          'encrypted': true,
                          'description': 'GCP Service Account JSON to be used for authentication when `auth_provider` is set to `gcp`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_id': {
                          'encrypted': true,
                          'description': 'Azure Client ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_secret': {
                          'encrypted': true,
                          'description': 'Azure Client Secret to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_tenant_id': {
                          'encrypted': true,
                          'description': 'Azure Tenant ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                    ],
                    'required': false,
                    'description': "Cloud auth related configs for connecting to a Cloud Provider's Redis instance.",
                    'type': 'record',
                  },
                },
                {
                  'database': {
                    'description': 'Database to use for the Redis connection when using the `redis` strategy',
                    'default': 0,
                    'type': 'integer',
                  },
                },
                {
                  'keepalive_pool_size': {
                    'default': 256,
                    'description': "The size limit for every cosocket connection pool associated with every remote server, per worker process. If neither `keepalive_pool_size` nor `keepalive_backlog` is specified, no pool is created. If `keepalive_pool_size` isn't specified but `keepalive_backlog` is specified, then the pool uses the default value. Try to increase (e.g. 512) this value if latency is high or throughput is low.",
                    'between': [
                      1,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'keepalive_backlog': {
                    'description': 'Limits the total number of opened connections for a pool. If the connection pool is full, connection queues above the limit go into the backlog queue. If the backlog queue is full, subsequent connect operations fail and return `nil`. Queued operations (subject to set timeouts) resume once the number of connections in the pool is less than `keepalive_pool_size`. If latency is high or throughput is low, try increasing this value. Empirically, this value is larger than `keepalive_pool_size`.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'sentinel_master': {
                    'type': 'string',
                    'description': 'Sentinel master to use for Redis connections. Defining this value implies using Redis Sentinel.',
                  },
                },
                {
                  'sentinel_role': {
                    'description': 'Sentinel role to use for Redis connections when the `redis` strategy is defined. Defining this value implies using Redis Sentinel.',
                    'type': 'string',
                    'one_of': [
                      'master',
                      'slave',
                      'any',
                    ],
                  },
                },
                {
                  'sentinel_nodes': {
                    'elements': {
                      'fields': [
                        {
                          'host': {
                            'required': true,
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'type': 'string',
                          },
                        },
                        {
                          'port': {
                            'default': 6379,
                            'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                            'between': [
                              0,
                              65535,
                            ],
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'description': 'Sentinel node addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Sentinel. The minimum length of the array is 1 element.',
                    'type': 'array',
                  },
                },
                {
                  'cluster_nodes': {
                    'elements': {
                      'fields': [
                        {
                          'ip': {
                            'required': true,
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'type': 'string',
                          },
                        },
                        {
                          'port': {
                            'default': 6379,
                            'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                            'between': [
                              0,
                              65535,
                            ],
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'description': 'Cluster addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Cluster. The minimum length of the array is 1 element.',
                    'type': 'array',
                  },
                },
                {
                  'ssl': {
                    'required': false,
                    'default': false,
                    'description': 'If set to true, uses SSL to connect to Redis.',
                    'type': 'boolean',
                  },
                },
                {
                  'ssl_verify': {
                    'required': false,
                    'default': true,
                    'description': 'If set to true, verifies the validity of the server SSL certificate. If setting this parameter, also configure `lua_ssl_trusted_certificate` in `kong.conf` to specify the CA (or server) certificate used by your Redis server. You may also need to configure `lua_ssl_verify_depth` accordingly.',
                    'type': 'boolean',
                  },
                },
                {
                  'server_name': {
                    'required': false,
                    'referenceable': true,
                    'description': 'A string representing an SNI (server name indication) value for TLS.',
                    'type': 'string',
                  },
                },
                {
                  'cluster_max_redirections': {
                    'required': false,
                    'default': 5,
                    'description': 'Maximum retry attempts for redirection.',
                    'type': 'integer',
                  },
                },
                {
                  'connection_is_proxied': {
                    'required': false,
                    'default': false,
                    'description': 'If the connection to Redis is proxied (e.g. Envoy), set it `true`. Set the `host` and `port` to point to the proxy address.',
                    'type': 'boolean',
                  },
                },
                {
                  'prefix': {
                    'required': false,
                    'description': 'The Redis session key prefix.',
                    'type': 'string',
                  },
                },
                {
                  'socket': {
                    'required': false,
                    'description': 'The Redis unix socket path.',
                    'type': 'string',
                  },
                },
              ],
              'type': 'record',
            },
          },
          {
            'reverify': {
              'required': false,
              'default': false,
              'description': 'Specifies whether to always verify tokens stored in the session.',
              'type': 'boolean',
            },
          },
          {
            'jwt_session_claim': {
              'required': false,
              'default': 'sid',
              'description': 'The claim to match against the JWT session cookie.',
              'type': 'string',
            },
          },
          {
            'jwt_session_cookie': {
              'required': false,
              'description': 'The name of the JWT session cookie.',
              'type': 'string',
            },
          },
          {
            'bearer_token_param_type': {
              'elements': {
                'one_of': [
                  'header',
                  'cookie',
                  'query',
                  'body',
                ],
                'type': 'string',
              },
              'default': [
                'header',
                'query',
                'body',
              ],
              'required': false,
              'description': "Where to look for the bearer token: - `header`: search the `Authorization`, `access-token`, and `x-access-token` HTTP headers - `query`: search the URL's query string - `body`: search the HTTP request body - `cookie`: search the HTTP request cookies specified with `config.bearer_token_cookie_name`.",
              'type': 'array',
            },
          },
          {
            'bearer_token_cookie_name': {
              'required': false,
              'description': 'The name of the cookie in which the bearer token is passed.',
              'type': 'string',
            },
          },
          {
            'bearer_token_header_name': {
              'required': false,
              'default': 'authorization:bearer',
              'description': "The name of the HTTP header from which the bearer token is retrieved. The default value is `authorization:bearer`, which reads the token from the `Authorization: Bearer <token>` header. Accepts plain header names such as `x-my-token` as well as Kong's special `authorization:bearer` notation. The `access-token` and `x-access-token` headers are also checked as a fallback for backward compatibility regardless of this setting.",
              'type': 'string',
            },
          },
          {
            'client_credentials_param_type': {
              'elements': {
                'one_of': [
                  'header',
                  'query',
                  'body',
                ],
                'type': 'string',
              },
              'default': [
                'header',
                'query',
                'body',
              ],
              'required': false,
              'description': "Where to look for the client credentials: - `header`: search the HTTP headers - `query`: search the URL's query string - `body`: search from the HTTP request body.",
              'type': 'array',
            },
          },
          {
            'password_param_type': {
              'elements': {
                'one_of': [
                  'header',
                  'query',
                  'body',
                ],
                'type': 'string',
              },
              'default': [
                'header',
                'query',
                'body',
              ],
              'required': false,
              'description': "Where to look for the username and password: - `header`: search the HTTP headers - `query`: search the URL's query string - `body`: search the HTTP request body.",
              'type': 'array',
            },
          },
          {
            'id_token_param_type': {
              'elements': {
                'one_of': [
                  'header',
                  'query',
                  'body',
                ],
                'type': 'string',
              },
              'default': [
                'header',
                'query',
                'body',
              ],
              'required': false,
              'description': "Where to look for the id token: - `header`: search the HTTP headers - `query`: search the URL's query string - `body`: search the HTTP request body.",
              'type': 'array',
            },
          },
          {
            'id_token_param_name': {
              'required': false,
              'description': 'The name of the parameter used to pass the id token.',
              'type': 'string',
            },
          },
          {
            'refresh_token_param_type': {
              'elements': {
                'one_of': [
                  'header',
                  'query',
                  'body',
                ],
                'type': 'string',
              },
              'default': [
                'header',
                'query',
                'body',
              ],
              'required': false,
              'description': "Where to look for the refresh token: - `header`: search the HTTP headers - `query`: search the URL's query string - `body`: search the HTTP request body.",
              'type': 'array',
            },
          },
          {
            'refresh_token_param_name': {
              'required': false,
              'description': 'The name of the parameter used to pass the refresh token.',
              'type': 'string',
            },
          },
          {
            'refresh_tokens': {
              'required': false,
              'default': true,
              'description': 'Specifies whether the plugin should try to refresh (soon to be) expired access tokens if the plugin has a `refresh_token` available.',
              'type': 'boolean',
            },
          },
          {
            'upstream_headers': {
              'required': false,
              'description': 'The upstream claim to header mappings.',
              'elements': {
                'fields': [
                  {
                    'header': {
                      'required': true,
                      'description': 'The name of the header.',
                      'type': 'string',
                    },
                  },
                  {
                    'path': {
                      'elements': {
                        'type': 'string',
                      },
                      'len_min': 1,
                      'required': true,
                      'description': 'The path of the header value.',
                      'type': 'array',
                    },
                  },
                ],
                'type': 'record',
              },
              'type': 'array',
            },
          },
          {
            'upstream_headers_claims': {
              'elements': {
                'type': 'string',
              },
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.upstream_headers_claims is deprecated, please use config.upstream_headers instead',
              },
              'required': false,
              'description': 'The upstream header claims. Only top level claims are supported.',
              'type': 'array',
            },
          },
          {
            'upstream_headers_names': {
              'elements': {
                'type': 'string',
              },
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.upstream_headers_names is deprecated, please use config.upstream_headers instead',
              },
              'required': false,
              'description': 'The upstream header names for the claim values.',
              'type': 'array',
            },
          },
          {
            'upstream_access_token_header': {
              'required': false,
              'default': 'authorization:bearer',
              'description': 'The upstream access token header.',
              'type': 'string',
            },
          },
          {
            'upstream_access_token_jwk_header': {
              'required': false,
              'description': 'The upstream access token JWK header.',
              'type': 'string',
            },
          },
          {
            'upstream_id_token_header': {
              'required': false,
              'description': 'The upstream id token header.',
              'type': 'string',
            },
          },
          {
            'upstream_id_token_jwk_header': {
              'required': false,
              'description': 'The upstream id token JWK header.',
              'type': 'string',
            },
          },
          {
            'upstream_refresh_token_header': {
              'required': false,
              'description': 'The upstream refresh token header.',
              'type': 'string',
            },
          },
          {
            'upstream_user_info_header': {
              'required': false,
              'description': 'The upstream user info header.',
              'type': 'string',
            },
          },
          {
            'upstream_user_info_jwt_header': {
              'required': false,
              'description': 'The upstream user info JWT header (in case the user info returns a JWT response).',
              'type': 'string',
            },
          },
          {
            'upstream_introspection_header': {
              'required': false,
              'description': 'The upstream introspection header.',
              'type': 'string',
            },
          },
          {
            'upstream_introspection_jwt_header': {
              'required': false,
              'description': 'The upstream introspection JWT header.',
              'type': 'string',
            },
          },
          {
            'upstream_session_id_header': {
              'required': false,
              'description': 'The upstream session id header.',
              'type': 'string',
            },
          },
          {
            'downstream_headers': {
              'required': false,
              'description': 'The downstream claim to header mappings.',
              'elements': {
                'fields': [
                  {
                    'header': {
                      'required': true,
                      'description': 'The name of the header.',
                      'type': 'string',
                    },
                  },
                  {
                    'path': {
                      'elements': {
                        'type': 'string',
                      },
                      'len_min': 1,
                      'required': true,
                      'description': 'The path of the header value.',
                      'type': 'array',
                    },
                  },
                ],
                'type': 'record',
              },
              'type': 'array',
            },
          },
          {
            'downstream_headers_claims': {
              'elements': {
                'type': 'string',
              },
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.downstream_headers_claims is deprecated, please use config.downstream_headers instead',
              },
              'required': false,
              'description': 'The downstream header claims. Only top level claims are supported.',
              'type': 'array',
            },
          },
          {
            'downstream_headers_names': {
              'elements': {
                'type': 'string',
              },
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.downstream_headers_names is deprecated, please use config.downstream_headers instead',
              },
              'required': false,
              'description': 'The downstream header names for the claim values.',
              'type': 'array',
            },
          },
          {
            'downstream_access_token_header': {
              'required': false,
              'description': 'The downstream access token header.',
              'type': 'string',
            },
          },
          {
            'downstream_access_token_jwk_header': {
              'required': false,
              'description': 'The downstream access token JWK header.',
              'type': 'string',
            },
          },
          {
            'downstream_id_token_header': {
              'required': false,
              'description': 'The downstream id token header.',
              'type': 'string',
            },
          },
          {
            'downstream_id_token_jwk_header': {
              'required': false,
              'description': 'The downstream id token JWK header.',
              'type': 'string',
            },
          },
          {
            'downstream_refresh_token_header': {
              'required': false,
              'description': 'The downstream refresh token header.',
              'type': 'string',
            },
          },
          {
            'downstream_user_info_header': {
              'required': false,
              'description': 'The downstream user info header.',
              'type': 'string',
            },
          },
          {
            'downstream_user_info_jwt_header': {
              'required': false,
              'description': 'The downstream user info JWT header (in case the user info returns a JWT response).',
              'type': 'string',
            },
          },
          {
            'downstream_introspection_header': {
              'required': false,
              'description': 'The downstream introspection header.',
              'type': 'string',
            },
          },
          {
            'downstream_introspection_jwt_header': {
              'required': false,
              'description': 'The downstream introspection JWT header.',
              'type': 'string',
            },
          },
          {
            'downstream_session_id_header': {
              'required': false,
              'description': 'The downstream session id header.',
              'type': 'string',
            },
          },
          {
            'login_methods': {
              'elements': {
                'one_of': [
                  'password',
                  'client_credentials',
                  'authorization_code',
                  'bearer',
                  'introspection',
                  'userinfo',
                  'kong_oauth2',
                  'refresh_token',
                  'session',
                ],
                'type': 'string',
              },
              'default': [
                'authorization_code',
              ],
              'required': false,
              'description': 'Enable login functionality with specified grants.',
              'type': 'array',
            },
          },
          {
            'login_action': {
              'default': 'upstream',
              'required': false,
              'description': 'What to do after successful login: - `upstream`: proxy request to upstream service - `response`: terminate request with a response - `redirect`: redirect to a different location.',
              'type': 'string',
              'one_of': [
                'upstream',
                'response',
                'redirect',
              ],
            },
          },
          {
            'login_tokens': {
              'elements': {
                'one_of': [
                  'id_token',
                  'access_token',
                  'refresh_token',
                  'tokens',
                  'introspection',
                ],
                'type': 'string',
              },
              'default': [
                'id_token',
              ],
              'required': false,
              'description': 'What tokens to include in `response` body or `redirect` query string or fragment: - `id_token`: include id token - `access_token`: include access token - `refresh_token`: include refresh token - `tokens`: include the full token endpoint response - `introspection`: include introspection response.',
              'type': 'array',
            },
          },
          {
            'login_redirect_mode': {
              'default': 'fragment',
              'required': false,
              'description': 'Where to place `login_tokens` when using `redirect` `login_action`: - `query`: place tokens in query string - `fragment`: place tokens in url fragment (not readable by servers).',
              'type': 'string',
              'one_of': [
                'query',
                'fragment',
              ],
            },
          },
          {
            'logout_query_arg': {
              'required': false,
              'description': 'The request query argument that activates the logout.',
              'type': 'string',
            },
          },
          {
            'logout_post_arg': {
              'required': false,
              'description': 'The request body argument that activates the logout.',
              'type': 'string',
            },
          },
          {
            'logout_uri_suffix': {
              'required': false,
              'description': 'The request URI suffix that activates the logout.',
              'type': 'string',
            },
          },
          {
            'logout_methods': {
              'elements': {
                'one_of': [
                  'POST',
                  'GET',
                  'DELETE',
                ],
                'type': 'string',
              },
              'default': [
                'POST',
                'DELETE',
              ],
              'required': false,
              'description': 'The request methods that can activate the logout: - `POST`: HTTP POST method - `GET`: HTTP GET method - `DELETE`: HTTP DELETE method.',
              'type': 'array',
            },
          },
          {
            'logout_revoke': {
              'required': false,
              'default': false,
              'description': 'Revoke tokens as part of the logout.\n\nFor more granular token revocation, you can also adjust the `logout_revoke_access_token` and `logout_revoke_refresh_token` parameters.',
              'type': 'boolean',
            },
          },
          {
            'logout_revoke_access_token': {
              'required': false,
              'default': true,
              'description': 'Revoke the access token as part of the logout. Requires `logout_revoke` to be set to `true`.',
              'type': 'boolean',
            },
          },
          {
            'logout_revoke_refresh_token': {
              'required': false,
              'default': true,
              'description': 'Revoke the refresh token as part of the logout. Requires `logout_revoke` to be set to `true`.',
              'type': 'boolean',
            },
          },
          {
            'consumer_claims': {
              'elements': {
                'elements': {
                  'type': 'string',
                },
                'description': 'A path of strings representing the location of the claim in a nested object. For example, to map to `user.info.id`, set `[ "user", "info", "id" ]`.',
                'type': 'array',
              },
              'description': 'The claims used for consumer mapping. Each entry represents a claim path inside the token payload. The paths are evaluated in order, and the first matching claim is used.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'consumer_by': {
              'elements': {
                'one_of': [
                  'id',
                  'username',
                  'custom_id',
                ],
                'type': 'string',
              },
              'default': [
                'username',
                'custom_id',
              ],
              'required': false,
              'description': 'Consumer fields used for mapping: - `id`: try to find the matching Consumer by `id` - `username`: try to find the matching Consumer by `username` - `custom_id`: try to find the matching Consumer by `custom_id`.',
              'type': 'array',
            },
          },
          {
            'consumer_optional': {
              'required': false,
              'default': false,
              'description': 'Do not terminate the request if consumer mapping fails.',
              'type': 'boolean',
            },
          },
          {
            'consumer_groups_claim': {
              'elements': {
                'type': 'string',
              },
              'description': 'The claim used for consumer groups mapping. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'consumer_groups_optional': {
              'required': false,
              'default': false,
              'description': 'Do not terminate the request if consumer groups mapping fails.',
              'type': 'boolean',
            },
          },
          {
            'credential_claim': {
              'elements': {
                'type': 'string',
              },
              'default': [
                'sub',
              ],
              'required': false,
              'description': 'The claim used to derive virtual credentials (e.g. to be consumed by the rate-limiting plugin), in case the consumer mapping is not used. If multiple values are set, it means the claim is inside a nested object of the token payload.',
              'type': 'array',
            },
          },
          {
            'anonymous': {
              'required': false,
              'description': 'An optional string (consumer UUID or username) value that functions as an “anonymous” consumer if authentication fails. If empty (default null), requests that fail authentication will return a `4xx` HTTP status code. This value must refer to the consumer `id` or `username` attribute, and **not** its `custom_id`.',
              'type': 'string',
            },
          },
          {
            'run_on_preflight': {
              'required': false,
              'default': true,
              'description': 'Specifies whether to run this plugin on pre-flight (`OPTIONS`) requests.',
              'type': 'boolean',
            },
          },
          {
            'leeway': {
              'required': false,
              'default': 0,
              'description': 'Defines leeway time (in seconds) for `auth_time`, `exp`, `iat`, and `nbf` claims',
              'type': 'number',
            },
          },
          {
            'verify_parameters': {
              'required': false,
              'default': false,
              'description': 'Verify plugin configuration against discovery.',
              'type': 'boolean',
            },
          },
          {
            'verify_nonce': {
              'required': false,
              'default': true,
              'description': 'Verify nonce on authorization code flow.',
              'type': 'boolean',
            },
          },
          {
            'verify_claims': {
              'required': false,
              'default': true,
              'description': 'Verify tokens for standard claims.',
              'type': 'boolean',
            },
          },
          {
            'verify_signature': {
              'required': false,
              'default': true,
              'description': 'Verify signature of tokens.',
              'type': 'boolean',
            },
          },
          {
            'ignore_signature': {
              'elements': {
                'one_of': [
                  'password',
                  'client_credentials',
                  'authorization_code',
                  'refresh_token',
                  'session',
                  'introspection',
                  'userinfo',
                ],
                'type': 'string',
              },
              'default': [],
              'required': false,
              'description': 'Skip the token signature verification on certain grants: - `password`: OAuth password grant - `client_credentials`: OAuth client credentials grant - `authorization_code`: authorization code flow - `refresh_token`: OAuth refresh token grant - `session`: session cookie authentication - `introspection`: OAuth introspection - `userinfo`: OpenID Connect user info endpoint authentication.',
              'type': 'array',
            },
          },
          {
            'enable_hs_signatures': {
              'required': false,
              'default': false,
              'description': 'Enable shared secret, for example, HS256, signatures (when disabled they will not be accepted).',
              'type': 'boolean',
            },
          },
          {
            'disable_session': {
              'elements': {
                'one_of': [
                  'password',
                  'client_credentials',
                  'authorization_code',
                  'bearer',
                  'introspection',
                  'userinfo',
                  'kong_oauth2',
                  'refresh_token',
                  'session',
                ],
                'type': 'string',
              },
              'description': 'Disable issuing the session cookie with the specified grants.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'cache_ttl': {
              'required': false,
              'default': 3600,
              'description': 'The default cache ttl in seconds that is used in case the cached object does not specify the expiry.',
              'type': 'number',
            },
          },
          {
            'cache_ttl_max': {
              'required': false,
              'description': 'The maximum cache ttl in seconds (enforced).',
              'type': 'number',
            },
          },
          {
            'cache_ttl_min': {
              'required': false,
              'description': 'The minimum cache ttl in seconds (enforced).',
              'type': 'number',
            },
          },
          {
            'cache_ttl_neg': {
              'required': false,
              'description': 'The negative cache ttl in seconds.',
              'type': 'number',
            },
          },
          {
            'cache_ttl_resurrect': {
              'required': false,
              'description': 'The resurrection ttl in seconds.',
              'type': 'number',
            },
          },
          {
            'cache_tokens': {
              'required': false,
              'default': true,
              'description': 'Cache the token endpoint requests.',
              'type': 'boolean',
            },
          },
          {
            'cache_tokens_salt': {
              'required': false,
              'description': 'Salt used for generating the cache key that is used for caching the token endpoint requests.',
              'auto': true,
              'type': 'string',
            },
          },
          {
            'cache_introspection': {
              'required': false,
              'default': true,
              'description': 'Cache the introspection endpoint requests.',
              'type': 'boolean',
            },
          },
          {
            'cache_token_exchange': {
              'required': false,
              'default': true,
              'description': 'Cache the legacy token exchange endpoint requests.',
              'type': 'boolean',
            },
          },
          {
            'cache_user_info': {
              'required': false,
              'default': true,
              'description': 'Cache the user info requests.',
              'type': 'boolean',
            },
          },
          {
            'search_user_info': {
              'required': false,
              'default': false,
              'description': 'Specify whether to use the user info endpoint to get additional claims for consumer mapping, credential mapping, authenticated groups, and upstream and downstream headers.',
              'type': 'boolean',
            },
          },
          {
            'hide_credentials': {
              'required': false,
              'default': true,
              'description': 'Remove the credentials used for authentication from the request. If multiple credentials are sent with the same request, the plugin will remove those that were used for successful authentication.',
              'type': 'boolean',
            },
          },
          {
            'http_version': {
              'required': false,
              'default': 1.1,
              'description': 'The HTTP version used for the requests by this plugin: - `1.1`: HTTP 1.1 (the default) - `1.0`: HTTP 1.0.',
              'type': 'number',
            },
          },
          {
            'http_proxy': {
              'required': false,
              'description': 'The HTTP proxy.',
              'type': 'string',
            },
          },
          {
            'http_proxy_authorization': {
              'required': false,
              'description': 'The HTTP proxy authorization.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'https_proxy': {
              'required': false,
              'description': 'The HTTPS proxy.',
              'type': 'string',
            },
          },
          {
            'https_proxy_authorization': {
              'required': false,
              'description': 'The HTTPS proxy authorization.',
              'referenceable': true,
              'type': 'string',
            },
          },
          {
            'no_proxy': {
              'required': false,
              'description': 'Do not use proxy with these hosts.',
              'type': 'string',
            },
          },
          {
            'keepalive': {
              'required': false,
              'default': true,
              'description': 'Use keepalive with the HTTP client.',
              'type': 'boolean',
            },
          },
          {
            'ssl_verify': {
              'required': false,
              'default': true,
              'description': 'Verify identity provider server certificate. If set to `true`, the plugin uses the CA certificate set in the `kong.conf` config parameter `lua_ssl_trusted_certificate`.',
              'type': 'boolean',
            },
          },
          {
            'timeout': {
              'required': false,
              'default': 10000,
              'description': 'Network IO timeout in milliseconds.',
              'type': 'number',
            },
          },
          {
            'display_errors': {
              'required': false,
              'default': false,
              'description': 'Display errors on failure responses.',
              'type': 'boolean',
            },
          },
          {
            'by_username_ignore_case': {
              'required': false,
              'default': false,
              'description': 'If `consumer_by` is set to `username`, specify whether `username` can match consumers case-insensitively.',
              'type': 'boolean',
            },
          },
          {
            'resolve_distributed_claims': {
              'required': false,
              'default': false,
              'description': 'Distributed claims are represented by the `_claim_names` and `_claim_sources` members of the JSON object containing the claims. If this parameter is set to `true`, the plugin explicitly resolves these distributed claims.',
              'type': 'boolean',
            },
          },
          {
            'expose_error_code': {
              'description': 'Specifies whether to expose the error code header, as defined in RFC 6750. If an authorization request fails, this header is sent in the response. Set to `false` to disable.',
              'default': true,
              'type': 'boolean',
            },
          },
          {
            'token_cache_key_include_scope': {
              'description': 'Include the scope in the token cache key, so token with different scopes are considered diffrent tokens.',
              'default': false,
              'type': 'boolean',
            },
          },
          {
            'introspection_token_param_name': {
              'required': false,
              'default': 'token',
              'description': "Designate token's parameter name for introspection.",
              'type': 'string',
            },
          },
          {
            'revocation_token_param_name': {
              'required': false,
              'default': 'token',
              'description': "Designate token's parameter name for revocation.",
              'type': 'string',
            },
          },
          {
            'proof_of_possession_mtls': {
              'default': 'off',
              'required': false,
              'description': 'Enable mtls proof of possession. If set to strict, all tokens (from supported auth_methods: bearer, introspection, and session granted with bearer or introspection) are verified, if set to optional, only tokens that contain the certificate hash claim are verified. If the verification fails, the request will be rejected with 401.',
              'type': 'string',
              'one_of': [
                'off',
                'strict',
                'optional',
              ],
            },
          },
          {
            'proof_of_possession_auth_methods_validation': {
              'required': false,
              'default': true,
              'description': 'If set to true, only the auth_methods that are compatible with Proof of Possession (PoP) can be configured when PoP is enabled. If set to false, all auth_methods will be configurable and PoP checks will be silently skipped for those auth_methods that are not compatible with PoP.',
              'type': 'boolean',
            },
          },
          {
            'proof_of_possession_mtls_from_header': {
              'entity_checks': [
                {
                  'mutually_required': [
                    'http_proxy_host',
                    'http_proxy_port',
                  ],
                },
                {
                  'mutually_required': [
                    'https_proxy_host',
                    'https_proxy_port',
                  ],
                },
              ],
              'fields': [
                {
                  'ca_certificates': {
                    'required': true,
                    'description': 'List of CA Certificate UUIDs to use when validating the client certificate chain. At least one is required.',
                    'elements': {
                      'uuid': true,
                      'type': 'string',
                    },
                    'type': 'set',
                  },
                },
                {
                  'allow_partial_chain': {
                    'required': true,
                    'description': 'Allow certificate verification with only an intermediate certificate. When enabled, a full chain to the root CA is not required.',
                    'default': false,
                    'type': 'boolean',
                  },
                },
                {
                  'revocation_check_mode': {
                    'default': 'IGNORE_CA_ERROR',
                    'required': false,
                    'description': 'Controls client certificate revocation check behavior. `SKIP` disables revocation checking. `IGNORE_CA_ERROR` respects revocation status when reachable but ignores network errors. `STRICT` requires a successful revocation check.',
                    'type': 'string',
                    'one_of': [
                      'SKIP',
                      'IGNORE_CA_ERROR',
                      'STRICT',
                    ],
                  },
                },
                {
                  'cert_cache_ttl': {
                    'required': false,
                    'description': 'Time in milliseconds to cache the revocation check result for a given certificate.',
                    'default': 60000,
                    'type': 'number',
                  },
                },
                {
                  'ssl_verify': {
                    'required': false,
                    'description': 'Verify the TLS certificate of the OCSP responder or CRL distribution point server.',
                    'default': true,
                    'type': 'boolean',
                  },
                },
                {
                  'http_timeout': {
                    'required': false,
                    'description': 'HTTP timeout in milliseconds when communicating with the OCSP server or downloading CRL.',
                    'default': 30000,
                    'type': 'number',
                  },
                },
                {
                  'http_proxy_host': {
                    'type': 'string',
                    'description': 'A string representing a host name, such as example.com.',
                  },
                },
                {
                  'http_proxy_port': {
                    'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                    'between': [
                      0,
                      65535,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'https_proxy_host': {
                    'type': 'string',
                    'description': 'A string representing a host name, such as example.com.',
                  },
                },
                {
                  'https_proxy_port': {
                    'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                    'between': [
                      0,
                      65535,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'certificate_header_name': {
                    'required': true,
                    'description': 'Name of the HTTP header that contains the injected client certificate',
                    'type': 'string',
                  },
                },
                {
                  'certificate_header_format': {
                    'default': 'url_encoded',
                    'required': true,
                    'description': 'Encoding format of the certificate in the header. Supported formats: `url_encoded`, `base64_encoded`.',
                    'type': 'string',
                    'one_of': [
                      'url_encoded',
                      'base64_encoded',
                    ],
                  },
                },
                {
                  'secure_source': {
                    'required': true,
                    'description': 'When set to `true`, only requests from trusted IP addresses (configured in `trusted_ips` in kong.conf) are allowed to use the certificate header. This prevents direct header injection from untrusted clients.',
                    'default': true,
                    'type': 'boolean',
                  },
                },
              ],
              'required': false,
              'description': 'Configuration for reading the client certificate from an HTTP header injected by a WAF or L7 proxy that terminates TLS. When configured, the plugin reads and validates the certificate from the specified header for mTLS Proof-of-Possession (PoP) verification instead of (or in addition to) the TLS layer certificate.',
              'type': 'record',
            },
          },
          {
            'tls_client_auth_cert_id': {
              'auto': false,
              'required': false,
              'description': 'ID of the Certificate entity representing the client certificate to use for mTLS client authentication for connections between Kong and the Auth Server.',
              'type': 'string',
              'uuid': true,
            },
          },
          {
            'tls_client_auth_ssl_verify': {
              'required': false,
              'default': true,
              'description': 'Verify identity provider server certificate during mTLS client authentication.',
              'type': 'boolean',
            },
          },
          {
            'mtls_token_endpoint': {
              'required': false,
              'description': 'Alias for the token endpoint to be used for mTLS client authentication. If set it overrides the value in `mtls_endpoint_aliases` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'mtls_introspection_endpoint': {
              'required': false,
              'description': 'Alias for the introspection endpoint to be used for mTLS client authentication. If set it overrides the value in `mtls_endpoint_aliases` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'mtls_revocation_endpoint': {
              'required': false,
              'description': 'Alias for the introspection endpoint to be used for mTLS client authentication. If set it overrides the value in `mtls_endpoint_aliases` returned by the discovery endpoint.',
              'type': 'string',
            },
          },
          {
            'proof_of_possession_dpop': {
              'default': 'off',
              'required': false,
              'description': "Enable Demonstrating Proof-of-Possession (DPoP). If set to strict, all request are verified despite the presence of the DPoP key claim (cnf.jkt). If set to optional, only tokens bound with DPoP's key are verified with the proof.",
              'type': 'string',
              'one_of': [
                'off',
                'strict',
                'optional',
              ],
            },
          },
          {
            'dpop_use_nonce': {
              'required': false,
              'default': false,
              'description': 'Specifies whether to challenge the client with a nonce value for DPoP proof. When enabled it will also be used to calculate the DPoP proof lifetime.',
              'type': 'boolean',
            },
          },
          {
            'dpop_proof_lifetime': {
              'required': false,
              'default': 300,
              'description': 'Specifies the lifetime in seconds of the DPoP proof. It determines how long the same proof can be used after creation. The creation time is determined by the nonce creation time if a nonce is used, and the iat claim otherwise.',
              'type': 'number',
            },
          },
          {
            'claims_forbidden': {
              'elements': {
                'type': 'string',
              },
              'description': 'If given, these claims are forbidden in the token payload.',
              'required': false,
              'type': 'array',
            },
          },
          {
            'cluster_cache_strategy': {
              'default': 'off',
              'required': false,
              'description': 'The strategy to use for the cluster cache. If set, the plugin will share cache with nodes configured with the same strategy backend. Currentlly only introspection cache is shared.',
              'type': 'string',
              'one_of': [
                'off',
                'redis',
              ],
            },
          },
          {
            'cluster_cache_redis': {
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
                    'then_field': 'host',
                    'if_field': 'connection_is_proxied',
                    'then_match': {
                      'required': true,
                    },
                    'if_match': {
                      'eq': true,
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
                    'default': 6379,
                    'between': [
                      0,
                      65535,
                    ],
                    'referenceable': true,
                    'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                    'type': 'integer',
                  },
                },
                {
                  'connect_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'send_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'read_timeout': {
                    'default': 2000,
                    'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
                    'between': [
                      0,
                      2147483646,
                    ],
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
                    'encrypted': true,
                    'description': 'Password to use for Redis connections. If undefined, no AUTH commands are sent to Redis.',
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
                    'encrypted': true,
                    'description': 'Sentinel password to authenticate with a Redis Sentinel instance. If undefined, no AUTH commands are sent to Redis Sentinels.',
                    'referenceable': true,
                    'type': 'string',
                  },
                },
                {
                  'cloud_authentication': {
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
                          'one_of': [
                            'aws',
                            'gcp',
                            'azure',
                          ],
                          'description': "Auth providers to be used to authenticate to a Cloud Provider's Redis instance.",
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
                          'required': false,
                          'description': 'This flag specifies whether the cluster is serverless when auth_provider is set to `aws`.',
                          'default': true,
                          'type': 'boolean',
                        },
                      },
                      {
                        'aws_access_key_id': {
                          'encrypted': true,
                          'description': 'AWS Access Key ID to be used for authentication when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_secret_access_key': {
                          'encrypted': true,
                          'description': 'AWS Secret Access Key to be used for authentication when `auth_provider` is set to `aws`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_assume_role_arn': {
                          'encrypted': true,
                          'description': 'The ARN of the IAM role to assume for generating ElastiCache IAM authentication tokens.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'aws_role_session_name': {
                          'encrypted': true,
                          'description': 'The session name for the temporary credentials when assuming the IAM role.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'gcp_service_account_json': {
                          'encrypted': true,
                          'description': 'GCP Service Account JSON to be used for authentication when `auth_provider` is set to `gcp`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_id': {
                          'encrypted': true,
                          'description': 'Azure Client ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_client_secret': {
                          'encrypted': true,
                          'description': 'Azure Client Secret to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                      {
                        'azure_tenant_id': {
                          'encrypted': true,
                          'description': 'Azure Tenant ID to be used for authentication when `auth_provider` is set to `azure`.',
                          'referenceable': true,
                          'type': 'string',
                        },
                      },
                    ],
                    'required': false,
                    'description': "Cloud auth related configs for connecting to a Cloud Provider's Redis instance.",
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
                    'default': 256,
                    'description': "The size limit for every cosocket connection pool associated with every remote server, per worker process. If neither `keepalive_pool_size` nor `keepalive_backlog` is specified, no pool is created. If `keepalive_pool_size` isn't specified but `keepalive_backlog` is specified, then the pool uses the default value. Try to increase (e.g. 512) this value if latency is high or throughput is low.",
                    'between': [
                      1,
                      2147483646,
                    ],
                    'type': 'integer',
                  },
                },
                {
                  'keepalive_backlog': {
                    'description': 'Limits the total number of opened connections for a pool. If the connection pool is full, connection queues above the limit go into the backlog queue. If the backlog queue is full, subsequent connect operations fail and return `nil`. Queued operations (subject to set timeouts) resume once the number of connections in the pool is less than `keepalive_pool_size`. If latency is high or throughput is low, try increasing this value. Empirically, this value is larger than `keepalive_pool_size`.',
                    'between': [
                      0,
                      2147483646,
                    ],
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
                    'elements': {
                      'fields': [
                        {
                          'host': {
                            'required': true,
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'type': 'string',
                          },
                        },
                        {
                          'port': {
                            'default': 6379,
                            'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                            'between': [
                              0,
                              65535,
                            ],
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'description': 'Sentinel node addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Sentinel. The minimum length of the array is 1 element.',
                    'type': 'array',
                  },
                },
                {
                  'cluster_nodes': {
                    'elements': {
                      'fields': [
                        {
                          'ip': {
                            'required': true,
                            'default': '127.0.0.1',
                            'description': 'A string representing a host name, such as example.com.',
                            'type': 'string',
                          },
                        },
                        {
                          'port': {
                            'default': 6379,
                            'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                            'between': [
                              0,
                              65535,
                            ],
                            'type': 'integer',
                          },
                        },
                      ],
                      'type': 'record',
                    },
                    'len_min': 1,
                    'required': false,
                    'description': 'Cluster addresses to use for Redis connections when the `redis` strategy is defined. Defining this field implies using a Redis Cluster. The minimum length of the array is 1 element.',
                    'type': 'array',
                  },
                },
                {
                  'ssl': {
                    'required': false,
                    'default': false,
                    'description': 'If set to true, uses SSL to connect to Redis.',
                    'type': 'boolean',
                  },
                },
                {
                  'ssl_verify': {
                    'required': false,
                    'default': true,
                    'description': 'If set to true, verifies the validity of the server SSL certificate. If setting this parameter, also configure `lua_ssl_trusted_certificate` in `kong.conf` to specify the CA (or server) certificate used by your Redis server. You may also need to configure `lua_ssl_verify_depth` accordingly.',
                    'type': 'boolean',
                  },
                },
                {
                  'server_name': {
                    'required': false,
                    'referenceable': true,
                    'description': 'A string representing an SNI (server name indication) value for TLS.',
                    'type': 'string',
                  },
                },
                {
                  'cluster_max_redirections': {
                    'required': false,
                    'default': 5,
                    'description': 'Maximum retry attempts for redirection.',
                    'type': 'integer',
                  },
                },
                {
                  'connection_is_proxied': {
                    'required': false,
                    'default': false,
                    'description': 'If the connection to Redis is proxied (e.g. Envoy), set it `true`. Set the `host` and `port` to point to the proxy address.',
                    'type': 'boolean',
                  },
                },
              ],
              'required': true,
              'shorthand_fields': [
                {
                  'timeout': {
                    'type': 'integer',
                    'deprecation': {
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
                      'message': 'redis schema field `timeout` is deprecated, use `connect_timeout`, `send_timeout` and `read_timeout`',
                      'removal_in_version': '4.0',
                    },
                  },
                },
                {
                  'sentinel_addresses': {
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'deprecation': {
                      'replaced_with': [
                        {
                          'path': [
                            'sentinel_nodes',
                          ],
                        },
                      ],
                      'message': 'sentinel_addresses is deprecated, please use sentinel_nodes instead',
                      'removal_in_version': '4.0',
                    },
                    'type': 'array',
                  },
                },
                {
                  'cluster_addresses': {
                    'elements': {
                      'type': 'string',
                    },
                    'len_min': 1,
                    'deprecation': {
                      'replaced_with': [
                        {
                          'path': [
                            'cluster_nodes',
                          ],
                        },
                      ],
                      'message': 'cluster_addresses is deprecated, please use cluster_nodes instead',
                      'removal_in_version': '4.0',
                    },
                    'type': 'array',
                  },
                },
              ],
              'type': 'record',
            },
          },
        ],
        'required': true,
        'shorthand_fields': [
          {
            'consumer_claim': {
              'elements': {
                'type': 'string',
              },
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'consumer_claims',
                    ],
                  },
                ],
                'message': 'openid-connect: config.consumer_claim is deprecated, please use config.consumer_claims instead',
                'removal_in_version': '4.0',
              },
              'type': 'array',
            },
          },
          {
            'authorization_cookie_lifetime': {
              'type': 'number',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.authorization_cookie_lifetime is deprecated, please use config.authorization_rolling_timeout instead',
              },
            },
          },
          {
            'authorization_cookie_samesite': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.authorization_cookie_samesite is deprecated, please use config.authorization_cookie_same_site instead',
              },
            },
          },
          {
            'authorization_cookie_httponly': {
              'type': 'boolean',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.authorization_cookie_httponly is deprecated, please use config.authorization_cookie_http_only instead',
              },
            },
          },
          {
            'session_cookie_lifetime': {
              'type': 'number',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_lifetime is deprecated, please use config.session_rolling_timeout instead',
              },
            },
          },
          {
            'session_cookie_idletime': {
              'type': 'number',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_idletime is deprecated, please use config.session_idling_timeout instead',
              },
            },
          },
          {
            'session_cookie_samesite': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_samesite is deprecated, please use config.session_cookie_same_site instead',
              },
            },
          },
          {
            'session_cookie_httponly': {
              'type': 'boolean',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_httponly is deprecated, please use config.session_cookie_http_only instead',
              },
            },
          },
          {
            'session_memcache_prefix': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_memcache_prefix is deprecated, please use config.session_memcached_prefix instead',
              },
            },
          },
          {
            'session_memcache_socket': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_memcache_socket is deprecated, please use config.session_memcached_socket instead',
              },
            },
          },
          {
            'session_memcache_host': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_memcache_host is deprecated, please use config.session_memcached_host instead',
              },
            },
          },
          {
            'session_memcache_port': {
              'type': 'integer',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_memcache_port is deprecated, please use config.session_memcached_port instead',
              },
            },
          },
          {
            'session_cookie_renew': {
              'type': 'number',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_renew option does not exist anymore',
              },
            },
          },
          {
            'session_cookie_maxsize': {
              'type': 'integer',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_cookie_maxsize option does not exist anymore',
              },
            },
          },
          {
            'session_strategy': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_strategy option does not exist anymore',
              },
            },
          },
          {
            'session_compressor': {
              'type': 'string',
              'deprecation': {
                'removal_in_version': '4.0',
                'message': 'openid-connect: config.session_compressor option does not exist anymore',
              },
            },
          },
          {
            'session_redis_prefix': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'prefix',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_prefix is deprecated, please use config.redis.prefix instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_socket': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'socket',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_socket is deprecated, please use config.redis.socket instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_host': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'host',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_host is deprecated, please use config.redis.host instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_port': {
              'type': 'integer',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'port',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_port is deprecated, please use config.redis.port instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_username': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'username',
                    ],
                  },
                ],
                'message': 'openid-connect: config.redis_host is deprecated, please use config.redis.host instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_password': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'password',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_password is deprecated, please use config.redis.password instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_connect_timeout': {
              'type': 'integer',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'connect_timeout',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_connect_timeout is deprecated, please use config.redis.connect_timeout instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_read_timeout': {
              'type': 'integer',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'read_timeout',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_read_timeout is deprecated, please use config.redis.read_timeout instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_send_timeout': {
              'type': 'integer',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'send_timeout',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_send_timeout is deprecated, please use config.redis.send_timeout instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_ssl': {
              'type': 'boolean',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'ssl',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_ssl is deprecated, please use config.redis.ssl instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_ssl_verify': {
              'type': 'boolean',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'ssl_verify',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_ssl_verify is deprecated, please use config.redis.ssl_verify instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_server_name': {
              'type': 'string',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'server_name',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_server_name is deprecated, please use config.redis.server_name instead',
                'removal_in_version': '4.0',
              },
            },
          },
          {
            'session_redis_cluster_nodes': {
              'elements': {
                'fields': [
                  {
                    'ip': {
                      'required': true,
                      'default': '127.0.0.1',
                      'description': 'A string representing a host name, such as example.com.',
                      'type': 'string',
                    },
                  },
                  {
                    'port': {
                      'default': 6379,
                      'description': 'An integer representing a port number between 0 and 65535, inclusive.',
                      'between': [
                        0,
                        65535,
                      ],
                      'type': 'integer',
                    },
                  },
                ],
                'type': 'record',
              },
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'cluster_nodes',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_cluster_nodes is deprecated, please use config.redis.cluster_nodes instead',
                'removal_in_version': '4.0',
              },
              'type': 'array',
            },
          },
          {
            'session_redis_cluster_max_redirections': {
              'type': 'integer',
              'deprecation': {
                'replaced_with': [
                  {
                    'path': [
                      'redis',
                      'cluster_max_redirections',
                    ],
                  },
                ],
                'message': 'openid-connect: config.session_redis_cluster_max_redirections is deprecated, please use config.redis.cluster_max_redirections instead',
                'removal_in_version': '4.0',
              },
            },
          },
        ],
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
