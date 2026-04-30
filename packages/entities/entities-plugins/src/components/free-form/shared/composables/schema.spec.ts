import { describe, expect, it } from 'vitest'

import { useSchemaHelpers } from './schema'

import type { FormSchema } from '../../../../types/plugins/form-schema'

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
