import { describe, it, expect } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { useSchemas } from './useSchemas'

// withSetup provides a valid Vue instance for the composables used by useSchemas.
function withSetup<T>(fn: () => T): T {
  let result!: T
  const app = createApp(defineComponent({
    setup() {
      result = fn()
      return () => h('div')
    },
  }))
  app.mount(document.createElement('div'))
  return result
}

describe('useSchemas', () => {
  // Minimal schema that mimics the flat object produced by PluginForm.vue's buildFormSchema.
  const makeSchema = (overrides: Record<string, any> = {}) => ({
    name: { default: 'my-clone', type: 'input', inputType: 'hidden', styleClasses: 'd-none', pinned: true },
    enabled: { type: 'switch', model: 'enabled', default: true, pinned: true },
    ...overrides,
  })

  describe('parseSchema – _sourcePlugin handling', () => {
    it('excludes _sourcePlugin from rendered form fields', () => {
      const { parseSchema } = withSetup(() => useSchemas())
      const schema = makeSchema({ _sourcePlugin: 'openid-connect' })

      const result = parseSchema(schema)
      const fieldModels = result.schema.fields?.map((f: any) => f.model) ?? []

      expect(fieldModels).not.toContain('_sourcePlugin')
    })

    it('generates flat fields schema for a cloned plugin', () => {
      const { parseSchema } = withSetup(() => useSchemas())
      const schema = makeSchema({ _sourcePlugin: 'openid-connect' })

      const result = parseSchema(schema)

      expect(result.schema).toHaveProperty('fields')
      expect(result.schema).not.toHaveProperty('groups')
    })

    it('generates flat fields schema for a plain custom plugin without _sourcePlugin', () => {
      // Every plugin is rendered with free-form, so the grouped VFG schema is never generated
      const { parseSchema } = withSetup(() => useSchemas())
      const schema = makeSchema()

      const result = parseSchema(schema)

      expect(result.schema).toHaveProperty('fields')
      expect(result.schema).not.toHaveProperty('groups')
    })
  })
})
