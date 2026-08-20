import { describe, expect, it } from 'vitest'

import { buildArraySchemaMap, useSchemaHelpers } from './schema'

import type { ArrayFieldSchema, FormSchema, StringFieldSchema } from '../../../../types/plugins/form-schema'

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
})
