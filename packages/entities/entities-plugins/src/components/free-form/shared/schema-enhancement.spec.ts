import { describe, it, expect } from 'vitest'
import { distributeEntityChecks } from './schema-enhancement'
import type { EntityCheck, FormSchema, RecordFieldSchema } from '../../../types/plugins/form-schema'

describe('distributeEntityChecks', () => {
  // Helper to create a minimal form schema
  const createFormSchema = (configFields: RecordFieldSchema['fields'], entityChecks?: EntityCheck[]): FormSchema => ({
    type: 'record',
    fields: [
      {
        config: {
          type: 'record',
          fields: configFields,
          entity_checks: entityChecks,
        },
      },
    ],
  })

  // Helper to get entity_checks at a specific path
  const getEntityChecksAtPath = (schema: FormSchema, path: string[]): EntityCheck[] | undefined => {
    let current: any = schema.fields.find(f => Object.keys(f)[0] === 'config')?.config
    for (const part of path) {
      if (!current?.fields) return undefined
      const field = current.fields.find((f: any) => Object.keys(f)[0] === part)
      if (!field) return undefined
      current = field[part]
    }
    return current?.entity_checks
  }

  describe('basic move scenarios', () => {
    it('should move at_least_one_of check to LCA level', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                {
                  b: {
                    type: 'record',
                    fields: [
                      { c: { type: 'string' } },
                      { d: { type: 'string' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
        [{ at_least_one_of: ['a.b.c', 'a.b.d'] }],
      )

      const result = distributeEntityChecks(schema)

      // Should be moved to a.b level
      const checksAtAB = getEntityChecksAtPath(result, ['a', 'b'])
      expect(checksAtAB).toEqual([{ at_least_one_of: ['c', 'd'] }])

      // Should be removed from config level
      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toBeUndefined()
    })

    it('should move mutually_required check to LCA level', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { x: { type: 'string' } },
                { y: { type: 'string' } },
              ],
            },
          },
        ],
        [{ mutually_required: ['a.x', 'a.y'] }],
      )

      const result = distributeEntityChecks(schema)

      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toEqual([{ mutually_required: ['x', 'y'] }])
    })

    it('should move mutually_exclusive check to LCA level', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { m: { type: 'string' } },
                { n: { type: 'string' } },
              ],
            },
          },
        ],
        [{ mutually_exclusive: ['a.m', 'a.n'] }],
      )

      const result = distributeEntityChecks(schema)

      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toEqual([{ mutually_exclusive: ['m', 'n'] }])
    })
  })

  describe('keep in place scenarios', () => {
    it('should keep check in place when fields have no common prefix', () => {
      const schema = createFormSchema(
        [
          { x: { type: 'string' } },
          { y: { type: 'string' } },
        ],
        [{ mutually_exclusive: ['x', 'y'] }],
      )

      const result = distributeEntityChecks(schema)

      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toEqual([{ mutually_exclusive: ['x', 'y'] }])
    })

    it('should keep conditional check in place (unsupported type)', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { b: { type: 'string' } },
                { c: { type: 'string' } },
              ],
            },
          },
        ],
        [
          {
            conditional: {
              if_field: 'a.b',
              if_match: { eq: true },
              then_field: 'a.c',
              then_match: { required: true },
            },
          },
        ],
      )

      const result = distributeEntityChecks(schema)

      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toHaveLength(1)
      expect(checksAtConfig![0]).toHaveProperty('conditional')
    })

    it('should keep conditional_at_least_one_of check in place (unsupported type)', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { b: { type: 'string' } },
                { c: { type: 'string' } },
              ],
            },
          },
        ],
        [
          {
            conditional_at_least_one_of: {
              if_field: 'a.b',
              if_match: { eq: true },
              then_at_least_one_of: ['a.c'],
            },
          },
        ],
      )

      const result = distributeEntityChecks(schema)

      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toHaveLength(1)
      expect(checksAtConfig![0]).toHaveProperty('conditional_at_least_one_of')
    })
  })

  describe('different depths', () => {
    it('should handle fields at different depths', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { x: { type: 'string' } },
                {
                  b: {
                    type: 'record',
                    fields: [
                      { y: { type: 'string' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
        [{ mutually_required: ['a.x', 'a.b.y'] }],
      )

      const result = distributeEntityChecks(schema)

      // LCA is 'a', so check should be at 'a' level with relative paths
      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toEqual([{ mutually_required: ['x', 'b.y'] }])
    })

    it('should handle single field rule', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                {
                  b: {
                    type: 'record',
                    fields: [
                      { c: { type: 'string' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
        [{ at_least_one_of: ['a.b.c'] }],
      )

      const result = distributeEntityChecks(schema)

      // LCA of single path 'a.b.c' is 'a.b'
      const checksAtAB = getEntityChecksAtPath(result, ['a', 'b'])
      expect(checksAtAB).toEqual([{ at_least_one_of: ['c'] }])
    })
  })

  describe('mixed checks', () => {
    it('should correctly separate checks that move vs stay', () => {
      const schema = createFormSchema(
        [
          { x: { type: 'string' } },
          { y: { type: 'string' } },
          {
            a: {
              type: 'record',
              fields: [
                { m: { type: 'string' } },
                { n: { type: 'string' } },
              ],
            },
          },
        ],
        [
          { mutually_exclusive: ['x', 'y'] }, // stays (no common prefix)
          { at_least_one_of: ['a.m', 'a.n'] }, // moves to 'a'
        ],
      )

      const result = distributeEntityChecks(schema)

      // First check should stay at config level
      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toEqual([{ mutually_exclusive: ['x', 'y'] }])

      // Second check should move to 'a' level
      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toEqual([{ at_least_one_of: ['m', 'n'] }])
    })
  })

  describe('recursive processing', () => {
    it('should process entity_checks at nested levels', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  a: {
                    type: 'record',
                    fields: [
                      {
                        b: {
                          type: 'record',
                          fields: [
                            { x: { type: 'string' } },
                            { y: { type: 'string' } },
                          ],
                        },
                      },
                    ],
                    entity_checks: [{ mutually_required: ['b.x', 'b.y'] }],
                  },
                },
              ],
              entity_checks: [{ at_least_one_of: ['a.b.x', 'a.b.y'] }],
            },
          },
        ],
      }

      const result = distributeEntityChecks(schema)

      // Config level check should move to a.b
      const checksAtAB = getEntityChecksAtPath(result, ['a', 'b'])
      expect(checksAtAB).toContainEqual({ at_least_one_of: ['x', 'y'] })
      expect(checksAtAB).toContainEqual({ mutually_required: ['x', 'y'] })

      // Config level should be cleared
      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toBeUndefined()

      // 'a' level should be cleared (moved to 'b')
      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty entity_checks array', () => {
      const schema = createFormSchema(
        [{ x: { type: 'string' } }],
        [],
      )

      const result = distributeEntityChecks(schema)

      expect(result).toBeDefined()
    })

    it('should handle undefined entity_checks', () => {
      const schema = createFormSchema(
        [{ x: { type: 'string' } }],
        undefined,
      )

      const result = distributeEntityChecks(schema)

      expect(result).toBeDefined()
    })

    it('should handle path that does not exist in schema', () => {
      const schema = createFormSchema(
        [{ x: { type: 'string' } }],
        [{ at_least_one_of: ['nonexistent.a', 'nonexistent.b'] }],
      )

      // Should not throw
      const result = distributeEntityChecks(schema)

      // Check should be removed from config (moved to nonexistent path, which is silently skipped)
      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toBeUndefined()
    })

    it('should handle path that leads to non-record type', () => {
      const schema = createFormSchema(
        [
          { x: { type: 'string' } }, // x is string, not record
        ],
        [{ at_least_one_of: ['x.a', 'x.b'] }],
      )

      // Should not throw
      const result = distributeEntityChecks(schema)

      // Check should be removed (path leads to non-record)
      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toBeUndefined()
    })

    it('should not mutate the original schema', () => {
      const schema = createFormSchema(
        [
          {
            a: {
              type: 'record',
              fields: [
                { b: { type: 'string' } },
                { c: { type: 'string' } },
              ],
            },
          },
        ],
        [{ at_least_one_of: ['a.b', 'a.c'] }],
      )

      const originalChecks = schema.fields[0].config.entity_checks

      distributeEntityChecks(schema)

      // Original should still have the check
      expect(schema.fields[0].config.entity_checks).toBe(originalChecks)
      expect(schema.fields[0].config.entity_checks).toEqual([{ at_least_one_of: ['a.b', 'a.c'] }])
    })

    it('should handle empty fields array', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [],
      }

      const result = distributeEntityChecks(schema)

      expect(result.fields).toEqual([])
    })

    it('should merge with existing entity_checks at target level', () => {
      const schema: FormSchema = {
        type: 'record',
        fields: [
          {
            config: {
              type: 'record',
              fields: [
                {
                  a: {
                    type: 'record',
                    fields: [
                      { x: { type: 'string' } },
                      { y: { type: 'string' } },
                    ],
                    entity_checks: [{ mutually_exclusive: ['x', 'y'] }],
                  },
                },
              ],
              entity_checks: [{ at_least_one_of: ['a.x', 'a.y'] }],
            },
          },
        ],
      }

      const result = distributeEntityChecks(schema)

      const checksAtA = getEntityChecksAtPath(result, ['a'])
      expect(checksAtA).toHaveLength(2)
      expect(checksAtA).toContainEqual({ mutually_exclusive: ['x', 'y'] })
      expect(checksAtA).toContainEqual({ at_least_one_of: ['x', 'y'] })
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical plugin config with nested auth settings', () => {
      const schema = createFormSchema(
        [
          { url: { type: 'string' } },
          {
            auth: {
              type: 'record',
              fields: [
                { username: { type: 'string' } },
                { password: { type: 'string' } },
                { token: { type: 'string' } },
              ],
            },
          },
        ],
        [
          { mutually_required: ['auth.username', 'auth.password'] },
          { mutually_exclusive: ['auth.password', 'auth.token'] },
        ],
      )

      const result = distributeEntityChecks(schema)

      const checksAtAuth = getEntityChecksAtPath(result, ['auth'])
      expect(checksAtAuth).toHaveLength(2)
      expect(checksAtAuth).toContainEqual({ mutually_required: ['username', 'password'] })
      expect(checksAtAuth).toContainEqual({ mutually_exclusive: ['password', 'token'] })

      const checksAtConfig = getEntityChecksAtPath(result, [])
      expect(checksAtConfig).toBeUndefined()
    })
  })
})
