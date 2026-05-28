// Synthetic plugin schema fabricated to exercise the strip-unknown-config-fields walker
// across deep nesting patterns. Not a real Kong plugin. Each record level carries at least
// one `shorthand_fields` alias so the walker is verified to strip at every depth — including
// inside array elements whose own records have their own shorthand.
//
// Patterns covered:
//   - record → record → record (deep canonical leaf)               : outer.inner.deep.value
//   - record → record → record (deep shorthand)                    : outer.inner.deep.legacy_deep
//   - record → record → record → array (of records w/ shorthand)   : outer.inner.entries[].*
//   - record → array (of records) → record → array (of primitives) : targets[].auth.allowed_scopes
//   - record → array (of records) → array (of records)             : pipelines[].steps[].*
//   - shorthand inside an array-element record                     : targets[].auth.legacy_token
//   - shorthand at the top of config                               : legacy_alias
//   - map field at deep nesting (user-defined keys pass through)   : outer.inner.metadata
//   - map field inside an array-element record                     : targets[].auth.headers
//   - map of records w/ shorthand (keys opaque, value records      : service_map (string → record)
//     get walked & shorthand inside each record value stripped)
export default {
  fields: [
    {
      config: {
        fields: [
          {
            outer: {
              fields: [
                {
                  inner: {
                    fields: [
                      {
                        // Array of records, deeply nested, with shorthand inside each element record.
                        entries: {
                          elements: {
                            fields: [
                              { key: { type: 'string' } },
                              { value: { type: 'string' } },
                            ],
                            shorthand_fields: [
                              // Deprecated inside an array-element record at deep nesting
                              { legacy_alias: { type: 'string' } },
                            ],
                            type: 'record',
                          },
                          type: 'array',
                        },
                      },
                      {
                        deep: {
                          fields: [
                            { value: { type: 'string' } },
                          ],
                          shorthand_fields: [
                            // Deprecated leaf in the deepest record
                            { legacy_deep: { type: 'string' } },
                          ],
                          type: 'record',
                        },
                      },
                      {
                        // Map field — user-defined keys, must pass through unchanged.
                        metadata: {
                          keys: { type: 'string' },
                          type: 'map',
                          values: { type: 'string' },
                        },
                      },
                    ],
                    shorthand_fields: [
                      // Deprecated alias inside `inner`
                      { legacy_inner: { type: 'string' } },
                    ],
                    type: 'record',
                  },
                },
              ],
              type: 'record',
            },
          },
          {
            targets: {
              elements: {
                fields: [
                  { url: { type: 'string' } },
                  {
                    auth: {
                      fields: [
                        { header_name: { type: 'string' } },
                        {
                          allowed_scopes: {
                            elements: { type: 'string' },
                            type: 'array',
                          },
                        },
                        {
                          // Map field inside an array-element record — passes through.
                          headers: {
                            keys: { type: 'string' },
                            type: 'map',
                            values: { type: 'string' },
                          },
                        },
                      ],
                      shorthand_fields: [
                        // Deprecated inside a record that itself lives inside an array element
                        { legacy_token: { type: 'string' } },
                      ],
                      type: 'record',
                    },
                  },
                ],
                type: 'record',
              },
              type: 'array',
            },
          },
          {
            pipelines: {
              elements: {
                fields: [
                  { id: { type: 'string' } },
                  {
                    steps: {
                      elements: {
                        fields: [
                          { name: { type: 'string' } },
                          { kind: { type: 'string' } },
                        ],
                        type: 'record',
                      },
                      type: 'array',
                    },
                  },
                ],
                type: 'record',
              },
              type: 'array',
            },
          },
          {
            // Map whose VALUES are records with their own `shorthand_fields`. User-defined
            // keys are opaque, but each record value is walked so its deprecated alias is stripped.
            service_map: {
              keys: { type: 'string' },
              type: 'map',
              values: {
                fields: [
                  { url: { type: 'string' } },
                  { weight: { type: 'integer' } },
                ],
                shorthand_fields: [
                  // Deprecated inside each map-value record
                  { endpoint: { type: 'string' } },
                ],
                type: 'record',
              },
            },
          },
        ],
        required: true,
        shorthand_fields: [
          // Deprecated at the top of config
          { legacy_alias: { type: 'string' } },
        ],
        type: 'record',
      },
    },
  ],
}
