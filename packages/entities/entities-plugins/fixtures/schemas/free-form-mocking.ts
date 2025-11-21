import type {
  BooleanFieldSchema,
  FormSchema,
  NumberLikeFieldSchema,
  RecordFieldSchema,
  StringFieldSchema,
  MapFieldSchema,
  ArrayLikeFieldSchema,
  ForeignFieldSchema,
} from '../../src/types/plugins/form-schema'

export function buildStringFieldCases(): Array<{ [name: string]: StringFieldSchema }> {
  return [
    {
      string_simple: {
        type: 'string',
      },
    },
    {
      string_complex: {
        type: 'string',
        required: true,
        description: 'A complex string field',
        default: 'default value',
      },
    },
    {
      string_referenceable: {
        type: 'string',
        encrypted: true,
        referenceable: true,
      },
    },
  ]
}

function buildNumberFieldCases(): Array<{ [name: string]: NumberLikeFieldSchema }> {
  return [
    {
      number_simple: {
        type: 'number',
      },
    },
    {
      number_complex: {
        type: 'number',
        required: true,
        description: 'A complex number field',
        default: 42,
        gt: 0,
      },
    },
    {
      number_between: {
        type: 'number',
        between: [1, 100],
      },
    },
    {
      number_enum: {
        type: 'integer',
        one_of: [-1, 0, 1],
      },
    },
  ]
}

export function buildBooleanFieldCases(): Array<{ [name: string]: BooleanFieldSchema }> {
  return [
    {
      boolean_simple: {
        type: 'boolean',
      },
    },
    {
      boolean_complex: {
        type: 'boolean',
        required: true,
        description: 'A complex boolean field',
        default: true,
      },
    },
  ]
}

export function buildRecordFieldCases(): Array<{ [name: string]: RecordFieldSchema }> {
  return [
    {
      record_simple: {
        type: 'record',
        description: 'A simple record field',
        fields: [
          {
            string_simple: {
              type: 'string',
            },
          },
        ],
      },
    },
    {
      record_required: {
        type: 'record',
        required: true,
        description: 'A required record field',
        fields: [
          {
            string_simple: {
              type: 'string',
            },
          },
        ],
      },
    },
    {
      record_recursive: {
        type: 'record',
        description: 'A recursive record field',
        fields: [
          {
            nested_record: {
              type: 'record',
              fields: [
                {
                  number_simple: {
                    type: 'number',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      record_default: {
        type: 'record',
        description: 'A record field with default values',
        default: {
          string_simple: 'default value',
        },
        fields: [
          {
            string_simple: {
              type: 'string',
            },
          },
        ],
      },
    },
  ]
}

export function buildMapFieldCases(): Array<{ [name: string]: MapFieldSchema }> {
  return [
    {
      map_simple: {
        type: 'map',
        keys: {
          type: 'string',
        },
        values: {
          type: 'number',
        },
      },
    },
    {
      map_complex: {
        type: 'map',
        required: true,
        description: 'A complex map field',
        keys: {
          type: 'string',
        },
        values: {
          type: 'string',
        },
        default: { foo: 'bar' },
      },
    },
    {
      map_referenceable: {
        type: 'map',
        keys: {
          type: 'string',
        },
        values: {
          type: 'string',
          referenceable: true,
        },
      },
    },
  ]
}

export function buildEnumFieldCases(): Array<{ [name: string]: StringFieldSchema | NumberLikeFieldSchema | BooleanFieldSchema }> {
  return [
    {
      enum_simple: {
        type: 'string',
        one_of: ['option1', 'option2', 'option3'],
      },
    },
    {
      enum_complex: {
        type: 'string',
        required: true,
        description: 'A complex enum field',
        one_of: ['option1', 'option2', 'option3'],
      },
    },
    {
      enum_default: {
        type: 'string',
        one_of: ['option1', 'option2', 'option3'],
        default: 'option2',
      },
    },
    // fixme: this has a bug in number options
    // {
    //   enum_number: {
    //     type: 'number',
    //     one_of: [1, 2, 3],
    //   },
    // },
    // fixme: this has a bug in boolean options
    // {
    //   enum_boolean: {
    //     type: 'boolean',
    //     one_of: [true, false],
    //   },
    // },
  ]
}

export function buildTagFieldCases(): Array<{ [name: string]: ArrayLikeFieldSchema }> {
  return [
    {
      tag_simple: {
        type: 'set',
        elements: {
          type: 'string',
        },
      },
    },
    {
      tag_complex: {
        type: 'set',
        required: true,
        description: 'A complex tag field',
        elements: {
          type: 'string',
        },
        default: ['tag1', 'tag2'],
      },
    },
  ]
}

export function buildArrayFieldCases(): Array<{ [name: string]: ArrayLikeFieldSchema }> {
  return [
    {
      array_simple: {
        type: 'array',
        elements: {
          type: 'string',
        },
      },
    },
    {
      array_complex: {
        type: 'array',
        required: true,
        description: 'A complex array field',
        elements: {
          type: 'number',
        },
        default: [0],
      },
    },
    // fixme: should support `resetLabelPath` in tests
    {
      array_of_records: {
        type: 'array',
        elements: {
          type: 'record',
          fields: [
            {
              foo: {
                type: 'string',
              },
            },
            {
              bar: {
                type: 'record',
                fields: [
                  {
                    baz: {
                      type: 'number',
                    },
                  },
                ],
              },
            },
          ],
        },
        description: 'An array of records',
      },
    },
    {
      array_of_array: {
        type: 'array',
        elements: {
          type: 'array',
          elements: {
            type: 'string',
          },
        },
        default: [['foo']],
      },
    },
  ]
}

export function buildForeignFieldCases(): Array<{ [name: string]: ForeignFieldSchema }> {
  return [
    {
      foreign_simple: {
        type: 'foreign',
        reference: 'certificates',
      },
    },
    {
      foreign_complex: {
        type: 'foreign',
        reference: 'certificates',
        description: 'Certificate reference',
        required: true,
        default: { id: '09d83195-e882-4b95-bf0f-9f3615fd2a4f' },
      },
    },
  ]
}

export function buildMockingSchema(): FormSchema {
  return {
    type: 'record',
    fields: [
      ...buildStringFieldCases(),
      ...buildNumberFieldCases(),
      ...buildBooleanFieldCases(),
      ...buildRecordFieldCases(),
      ...buildMapFieldCases(),
      ...buildEnumFieldCases(),
      ...buildTagFieldCases(),
      ...buildArrayFieldCases(),
      ...buildForeignFieldCases(),
    ],
  }
}
