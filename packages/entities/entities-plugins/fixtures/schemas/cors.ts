export default {
  fields: [
    {
      consumer: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        reference: 'consumers',
        type: 'foreign',
      },
    },
    {
      consumer_group: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        reference: 'consumer_groups',
        type: 'foreign',
      },
    },
    {
      protocols: {
        default: [
          'grpc',
          'grpcs',
          'http',
          'https',
        ],
        description: 'A set of strings representing HTTP protocols.',
        elements: {
          one_of: [
            'grpc',
            'grpcs',
            'http',
            'https',
          ],
          type: 'string',
        },
        required: true,
        type: 'set',
      },
    },
    {
      config: {
        fields: [
          {
            origins: {
              description: 'List of allowed domains for the `Access-Control-Allow-Origin` header. If you want to allow all origins, add `*` as a single value to this configuration field. The accepted values can either be flat strings or PCRE regexes.',
              elements: {
                type: 'string',
              },
              type: 'array',
            },
          },
          {
            headers: {
              description: 'Value for the `Access-Control-Allow-Headers` header.',
              elements: {
                type: 'string',
              },
              type: 'array',
            },
          },
          {
            exposed_headers: {
              description: 'Value for the `Access-Control-Expose-Headers` header. If not specified, no custom headers are exposed.',
              elements: {
                type: 'string',
              },
              type: 'array',
            },
          },
          {
            methods: {
              default: [
                'GET',
                'HEAD',
                'PUT',
                'PATCH',
                'POST',
                'DELETE',
                'OPTIONS',
                'TRACE',
                'CONNECT',
              ],
              description: "'Value for the `Access-Control-Allow-Methods` header. Available options include `GET`, `HEAD`, `PUT`, `PATCH`, `POST`, `DELETE`, `OPTIONS`, `TRACE`, `CONNECT`. By default, all options are allowed.'",
              elements: {
                one_of: [
                  'GET',
                  'HEAD',
                  'PUT',
                  'PATCH',
                  'POST',
                  'DELETE',
                  'OPTIONS',
                  'TRACE',
                  'CONNECT',
                ],
                type: 'string',
              },
              type: 'array',
            },
          },
          {
            max_age: {
              description: 'Indicates how long the results of the preflight request can be cached, in `seconds`.',
              type: 'number',
            },
          },
          {
            credentials: {
              default: false,
              description: 'Flag to determine whether the `Access-Control-Allow-Credentials` header should be sent with `true` as the value.',
              required: true,
              type: 'boolean',
            },
          },
          {
            preflight_continue: {
              default: false,
              description: 'A boolean value that instructs the plugin to proxy the `OPTIONS` preflight request to the Upstream service.',
              required: true,
              type: 'boolean',
            },
          },
          {
            private_network: {
              default: false,
              description: 'Flag to determine whether the `Access-Control-Allow-Private-Network` header should be sent with `true` as the value.',
              required: true,
              type: 'boolean',
            },
          },
        ],
        required: true,
        type: 'record',
      },
    },
  ],
}
