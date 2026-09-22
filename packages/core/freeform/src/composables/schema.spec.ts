import { describe, expect, it } from 'vitest'

import { buildArraySchemaMap, useSchemaHelpers } from './schema'

import type { ArrayFieldSchema, FormSchema, StringFieldSchema } from '../form-schema'

describe('buildArraySchemaMap', () => {
  it('propagates encrypted from the array schema to string elements', () => {
    const arraySchema: ArrayFieldSchema = {
      type: 'array',
      encrypted: true,
      elements: {
        type: 'string',
      },
    }

    const schemaMap = buildArraySchemaMap(arraySchema, 'introspection_headers_values')

    expect((schemaMap['introspection_headers_values.*'] as StringFieldSchema).encrypted).toBe(true)
  })

  it('does not add encrypted to non-string elements', () => {
    const arraySchema: ArrayFieldSchema = {
      type: 'array',
      encrypted: true,
      elements: {
        type: 'number',
      },
    }

    const schemaMap = buildArraySchemaMap(arraySchema, 'numbers')

    expect('encrypted' in schemaMap['numbers.*']).toBe(false)
  })

  it('does not add encrypted to elements when the array is not encrypted', () => {
    const arraySchema: ArrayFieldSchema = {
      type: 'array',
      elements: {
        type: 'string',
      },
    }

    const schemaMap = buildArraySchemaMap(arraySchema, 'plain_values')

    expect((schemaMap['plain_values.*'] as StringFieldSchema).encrypted).toBeUndefined()
  })
})

describe('useSchemaHelpers', () => {
  describe('getLabelAttributes', () => {
    it('sanitizes schema descriptions before exposing tooltip HTML', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  description_xss: {
                    type: 'string',
                    description: 'Safe **markdown** <img src=x onerror="alert(\'xss\')">',
                  },
                },
              ],
            },
          },
        ],
      }

      const { getLabelAttributes } = useSchemaHelpers(schema)
      const labelAttributes = getLabelAttributes('config.description_xss')

      expect(labelAttributes.info).toContain('<strong>markdown</strong>')
      expect(labelAttributes.info).toContain('<img')
      expect(labelAttributes.info).not.toContain('onerror')
      expect(labelAttributes.info).not.toContain('alert(')
    })
  })

  describe('emptyFieldValue config', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [
        { optional_field: { type: 'string' } },
        { required_field: { type: 'string', required: true } },
        { auto_field: { type: 'string', auto: true } },
        { defaulted_field: { type: 'string', default: 'preset' } },
      ],
    }

    it('defaults empty fields to null when emptyFieldValue is not provided', () => {
      const { getDefault, getEmptyOrDefault } = useSchemaHelpers(schema)

      expect(getDefault('optional_field')).toBeNull()
      expect(getDefault('required_field')).toBeNull()
      expect(getEmptyOrDefault('optional_field')).toBeNull()
    })

    it('defaults empty fields to null when emptyFieldValue is explicitly "null"', () => {
      const { getDefault, getEmptyOrDefault } = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'null' }))

      expect(getDefault('optional_field')).toBeNull()
      expect(getDefault('required_field')).toBeNull()
      expect(getEmptyOrDefault('optional_field')).toBeNull()
    })

    it('defaults empty fields to undefined when emptyFieldValue is "undefined"', () => {
      const { getDefault, getEmptyOrDefault } = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'undefined' }))

      expect(getDefault('optional_field')).toBeUndefined()
      expect(getDefault('required_field')).toBeUndefined()
      expect(getEmptyOrDefault('optional_field')).toBeUndefined()
    })

    it('keeps auto fields undefined regardless of emptyFieldValue', () => {
      const nullHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'null' }))
      const undefinedHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'undefined' }))

      expect(nullHelpers.getDefault('auto_field')).toBeUndefined()
      expect(undefinedHelpers.getDefault('auto_field')).toBeUndefined()
    })

    it('keeps an explicit schema default regardless of emptyFieldValue', () => {
      const nullHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'null' }))
      const undefinedHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'undefined' }))

      expect(nullHelpers.getDefault('defaulted_field')).toBe('preset')
      expect(undefinedHelpers.getDefault('defaulted_field')).toBe('preset')
    })

    it('omits keys that resolve to undefined from the whole-form default (getDefault with no path)', () => {
      const nullHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'null' }))
      const undefinedHelpers = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'undefined' }))

      const nullDefault = nullHelpers.getDefault()
      const undefinedDefault = undefinedHelpers.getDefault()

      // `auto_field` always resolves to undefined and is never a key, regardless of mode.
      expect('auto_field' in nullDefault).toBe(false)
      expect('auto_field' in undefinedDefault).toBe(false)

      // In 'null' mode, empty scalars are `null`-valued keys. In 'undefined' mode the
      // same fields resolve to `undefined` and `createRecordDefault` omits them
      // entirely — this changes the key set of the initial form data, which is the
      // highest-impact behavior this option has.
      expect(nullDefault).toHaveProperty('optional_field', null)
      expect(nullDefault).toHaveProperty('required_field', null)
      expect('optional_field' in undefinedDefault).toBe(false)
      expect('required_field' in undefinedDefault).toBe(false)

      expect(nullDefault.defaulted_field).toBe('preset')
      expect(undefinedDefault.defaulted_field).toBe('preset')
    })

    it('getEmptyValue never forces required structure or an explicit default (unlike getEmptyOrDefault)', () => {
      const { getEmptyValue } = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'null' }))
      const { getEmptyValue: getUndefinedEmptyValue } = useSchemaHelpers(schema, () => ({ emptyFieldValue: 'undefined' }))

      // getEmptyValue takes no path — it's just the configured sentinel,
      // used when a user actively clears a field (never the default).
      expect(getEmptyValue()).toBeNull()
      expect(getUndefinedEmptyValue()).toBeUndefined()
    })
  })

  describe('getFieldVersionInfo', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [
        {
          legacy_config: {
            type: 'record',
            min_ai_gateway_version: '2.2',
            fields: [
              { host: { type: 'string' } },
              { protocol: { type: 'string', min_ai_gateway_version: '2.1' } },
            ],
          },
        },
      ],
    }

    it('locks a field with no version requirement of its own when an ancestor is locked', () => {
      const { getFieldVersionInfo } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.1' }))

      // `legacy_config` requires 2.2, above the configured 2.1 — `host` has
      // no requirement of its own but inherits the container's lock.
      expect(getFieldVersionInfo('legacy_config')?.tooltip).toContain('2.2')
      expect(getFieldVersionInfo('legacy_config.host')?.tooltip).toContain('2.2')
    })

    it("reports the field's own requirement when it is stricter than an unlocked ancestor", () => {
      const { getFieldVersionInfo } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.1' }))

      // `legacy_config` itself is locked at this runtime version too, so this
      // mostly documents that a deeper, still-unmet requirement is also found.
      expect(getFieldVersionInfo('legacy_config.protocol')?.tooltip).toContain('2.2')
    })

    it('is undefined throughout once minRuntimeVersion satisfies every requirement in the chain', () => {
      const { getFieldVersionInfo } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.2' }))

      expect(getFieldVersionInfo('legacy_config')).toBeUndefined()
      expect(getFieldVersionInfo('legacy_config.host')).toBeUndefined()
      expect(getFieldVersionInfo('legacy_config.protocol')).toBeUndefined()
    })

    it('fails open (undefined) when minRuntimeVersion is not provided', () => {
      const { getFieldVersionInfo } = useSchemaHelpers(schema)

      expect(getFieldVersionInfo('legacy_config')).toBeUndefined()
      expect(getFieldVersionInfo('legacy_config.host')).toBeUndefined()
    })
  })

  describe('getDefault with a version-locked field', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [
        { gated_field: { type: 'string', min_ai_gateway_version: '2.1', default: 'preset' } },
        {
          gated_container: {
            type: 'record',
            min_ai_gateway_version: '2.1',
            fields: [
              { nested: { type: 'string', default: 'nested-preset' } },
            ],
          },
        },
      ],
    }

    it("skips a locked field's own default, instead of initializing it with an unreachable value", () => {
      const { getDefault } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.0' }))

      expect(getDefault('gated_field')).toBeNull()
    })

    it('keeps the default once minRuntimeVersion satisfies the requirement', () => {
      const { getDefault } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.1' }))

      expect(getDefault('gated_field')).toBe('preset')
    })

    it('fails open (keeps the default) when minRuntimeVersion is not provided', () => {
      const { getDefault } = useSchemaHelpers(schema)

      expect(getDefault('gated_field')).toBe('preset')
    })

    it("skips a nested field's default when it inherits a lock from its container", () => {
      const { getDefault } = useSchemaHelpers(schema, () => ({ minRuntimeVersion: '2.0' }))

      expect(getDefault('gated_container.nested')).toBeNull()
    })
  })
})
