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
})
