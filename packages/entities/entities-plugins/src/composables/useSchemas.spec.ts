import { describe, it, expect } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { useSchemas } from './useSchemas'

// useSchemas calls useExperimentalFreeForms which uses inject().
// withSetup provides a valid Vue instance so inject() doesn't warn.
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

    it('generates flat fields schema when _sourcePlugin is a shared-form plugin (openid-connect)', () => {
      // openid-connect → getSharedFormName returns 'OIDCForm' → parseSchema should produce flat fields
      const { parseSchema } = withSetup(() => useSchemas())
      const schema = makeSchema({ _sourcePlugin: 'openid-connect' })

      const result = parseSchema(schema)

      expect(result.schema).toHaveProperty('fields')
      expect(result.schema).not.toHaveProperty('groups')
    })

    it('generates grouped schema for a plain custom plugin without _sourcePlugin', () => {
      // No _sourcePlugin, unknown plugin name → grouped schema (default VFG layout)
      const { parseSchema } = withSetup(() => useSchemas())
      const schema = makeSchema()

      const result = parseSchema(schema)

      expect(result.schema).toHaveProperty('groups')
      expect(result.schema).not.toHaveProperty('fields')
    })
  })
})
