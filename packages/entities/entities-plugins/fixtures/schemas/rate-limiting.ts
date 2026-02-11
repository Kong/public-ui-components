// Minimal rate-limiting schema for testing experimental plugin engine selection
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
            second: {
              description: 'The number of HTTP requests that can be made per second.',
              gt: 0,
              type: 'number',
            },
          },
          {
            minute: {
              description: 'The number of HTTP requests that can be made per minute.',
              gt: 0,
              type: 'number',
            },
          },
          {
            hour: {
              description: 'The number of HTTP requests that can be made per hour.',
              gt: 0,
              type: 'number',
            },
          },
          {
            day: {
              description: 'The number of HTTP requests that can be made per day.',
              gt: 0,
              type: 'number',
            },
          },
          {
            policy: {
              default: 'local',
              description: 'The rate-limiting policies to use for retrieving and incrementing the limits.',
              one_of: [
                'local',
                'cluster',
                'redis',
              ],
              type: 'string',
            },
          },
          {
            fault_tolerant: {
              default: true,
              description: 'A boolean value that determines if the requests should be proxied even if Kong has troubles connecting a third-party data store.',
              required: true,
              type: 'boolean',
            },
          },
          {
            hide_client_headers: {
              default: false,
              description: 'Optionally hide informative response headers.',
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
