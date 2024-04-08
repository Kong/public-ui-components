export default {
  fields: [
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
      consumer_group: {
        description: 'Custom type for representing a foreign key with a null value allowed.',
        eq: null,
        reference: 'consumer_groups',
        type: 'foreign',
      },
    },
    {
      config: {
        fields: [
          {
            api_specification_filename: {
              description: "The path and name of the specification file loaded into Kong Gateway's database. You cannot use this option for DB-less or hybrid mode.",
              required: false,
              type: 'string',
            },
          },
          {
            api_specification: {
              description: 'The contents of the specification file. You must use this option for hybrid or DB-less mode. You can include the full specification as part of the configuration. In Kong Manager, you can copy and paste the contents of the spec directly into the `Config.Api Specification` text field.',
              required: false,
              type: 'string',
            },
          },
          {
            random_delay: {
              default: false,
              description: 'Enables a random delay in the mocked response. Introduces delays to simulate real-time response times by APIs.',
              type: 'boolean',
            },
          },
          {
            max_delay_time: {
              default: 1,
              description: 'The maximum value in seconds of delay time. Set this value when `random_delay` is enabled and you want to adjust the default. The value must be greater than the `min_delay_time`.',
              type: 'number',
            },
          },
          {
            min_delay_time: {
              default: 0.001,
              description: 'The minimum value in seconds of delay time. Set this value when `random_delay` is enabled and you want to adjust the default. The value must be less than the `max_delay_time`.',
              type: 'number',
            },
          },
          {
            random_examples: {
              default: false,
              description: 'Randomly selects one example and returns it. This parameter requires the spec to have multiple examples configured.',
              type: 'boolean',
            },
          },
          {
            included_status_codes: {
              description: 'A global list of the HTTP status codes that can only be selected and returned.',
              elements: {
                type: 'integer',
              },
              type: 'array',
            },
          },
          {
            random_status_code: {
              default: false,
              description: 'Determines whether to randomly select an HTTP status code from the responses of the corresponding API method. The default value is `false`, which means the minimum HTTP status code is always selected and returned.',
              required: true,
              type: 'boolean',
            },
          },
          {
            include_base_path: {
              default: false,
              description: 'Indicates whether to include the base path when performing path match evaluation.',
              required: true,
              type: 'boolean',
            },
          },
          {
            required_non_checkbox_field: {
              description: 'A non-checkbox but required field.',
              required: true,
              type: 'string',
            },
          },
        ],
        required: true,
        type: 'record',
      },
    },
  ],
}
