import { describe, it, expect } from 'vitest'
import composables from '..'
import { ConfigurationSchema, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'

const { setFieldType } = composables.usePluginHelpers()

describe('setFieldType()', () => {
  const key = 'cool_key'

  it('maintains previous schema entries', () => {
    const myOrder = 4
    const existingSchema: ConfigurationSchema = {
      [key]: {
        order: myOrder,
      },
    }
    const record = {
      type: 'boolean',
    }
    setFieldType(existingSchema, key, record)

    expect(existingSchema[key].order).toBe(myOrder)
  })

  describe('Types', () => {
    it('correctly sets boolean field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'boolean',
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.BadgeStatus)
    })

    it('correctly determine string set field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'set',
        elements: {
          type: 'string',
        },
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.BadgeTag)
    })

    it('correctly determine string array field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'array',
        elements: {
          type: 'string',
        },
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.BadgeTag)
    })

    it('correctly determine method string array field type', () => {
      const methodKeys = ['methods', 'logout_methods']
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'array',
        elements: {
          type: 'string',
        },
      }

      methodKeys.forEach((methodKey: string) => {
        setFieldType(existingSchema, methodKey, record)
        expect(existingSchema[methodKey].type).toBe(ConfigurationSchemaType.BadgeMethod)
      })
    })

    it('correctly determine record (json) array field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'array',
        elements: {
          type: 'record',
        },
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.Json)
    })

    it('correctly determine record (json) field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'record',
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.Json)
    })

    it('correctly determine unknown field type', () => {
      const existingSchema: ConfigurationSchema = {}
      const record = {
        type: 'xyz',
      }
      setFieldType(existingSchema, key, record)

      expect(existingSchema[key].type).toBe(ConfigurationSchemaType.Text)
    })
  })
})
