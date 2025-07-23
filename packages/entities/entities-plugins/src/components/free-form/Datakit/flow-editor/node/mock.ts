import type { FormSchema } from '../../../../../types/plugins/form-schema'

export const CallNodeSchema: FormSchema = {
  'fields': [
    {
      name: {
        type: 'string',
        required: true,
      },
    },
    {
      'method': {
        'default': 'GET',
        'description': 'A string representing an HTTP method, such as GET, POST, PUT, or DELETE. The string must contain only uppercase letters.',
        'len_max': 32,
        'len_min': 1,
        'match': '^%u+$',
        'type': 'string',
      },
    },
    {
      'ssl_server_name': {
        'description': 'A string representing an SNI (server name indication) value for TLS.',
        'type': 'string',
      },
    },
    {
      'timeout': {
        'between': [
          0,
          2147483646,
        ],
        'description': 'An integer representing a timeout in milliseconds. Must be between 0 and 2^31-2.',
        'type': 'integer',
      },
    },
    {
      'url': {
        'description': 'A string representing a URL, such as https://example.com/path/to/resource?q=search.',
        'required': true,
        'type': 'string',
      },
    },
    {
      'input': {
        'description': 'call node input',
        'len_max': 255,
        'len_min': 1,
        'match_any': {
          'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
          'patterns': [
            '^[A-Za-z_][A-Za-z0-9_-]*$',
            '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
          ],
        },
        'required': false,
        'type': 'string',
      },
    },
    {
      'inputs': {
        'description': 'call node inputs',
        'fields': [
          {
            'body': {
              'description': 'HTTP request body',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
          {
            'headers': {
              'description': 'HTTP request headers',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
          {
            'query': {
              'description': 'HTTP request query',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
        ],
        'required': false,
        'type': 'record',
      },
    },
    {
      'output': {
        'description': 'call node output',
        'len_max': 255,
        'len_min': 1,
        'match_any': {
          'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
          'patterns': [
            '^[A-Za-z_][A-Za-z0-9_-]*$',
            '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
          ],
        },
        'required': false,
        'type': 'string',
      },
    },
    {
      'outputs': {
        'description': 'call node outputs',
        'fields': [
          {
            'body': {
              'description': 'HTTP response body',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
          {
            'headers': {
              'description': 'HTTP response headers',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
          {
            'status': {
              'description': 'HTTP response status code',
              'len_max': 255,
              'len_min': 1,
              'match_any': {
                'err': 'must be one of NODE_NAME or NODE_NAME.FIELD',
                'patterns': [
                  '^[A-Za-z_][A-Za-z0-9_-]*$',
                  '^[A-Za-z_][A-Za-z0-9_-]*%..+$',
                ],
              },
              'required': false,
              'type': 'string',
            },
          },
        ],
        'required': false,
        'type': 'record',
      },
    },
  ],
  'type': 'record',
}
