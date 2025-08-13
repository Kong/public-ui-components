import type { FormSchema } from '../../../../../types/plugins/form-schema'

export const ServiceRequestSchema: FormSchema = {
  'fields': [
    {
      'input': {
        'description': 'filter input(s)',
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
  ],
  'type': 'record',
}

export const ResponseSchema: FormSchema = {
  'fields': [
    {
      'input': {
        'description': 'filter input(s)',
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
        ],
        'required': false,
        'type': 'record',
      },
    },
  ],
  'type': 'record',
}
