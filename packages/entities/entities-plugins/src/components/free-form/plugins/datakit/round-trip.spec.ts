import { describe, expect, it } from 'vitest'
import { DatakitConfigSchema } from './schema/strict'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './schema/compat'
import { goldenFixtures } from './test-utils/fixtures'
import { createTestStore, toPluginData } from './test-utils/store'

/**
 * Examples valid for the backend but not representable in the flow editor.
 * The compat schema must reject them so the UI stays in code mode.
 */
const CODE_ONLY_EXAMPLES: Record<string, string> = {
  // The flow editor does not support `inputs.url` on call nodes yet
  'authenticate-third-party-with-dynamic-url': 'Unrecognized key: "url"',
}

const flowFixtures = goldenFixtures.filter(({ id }) => !(id in CODE_ONLY_EXAMPLES))
const codeOnlyFixtures = goldenFixtures.filter(({ id }) => id in CODE_ONLY_EXAMPLES)

describe('Datakit golden examples', () => {
  // The strict schema is a subset of the backend constraints, so it must never reject a valid example
  it.each(goldenFixtures)('$id is accepted by the strict schema', ({ pluginData }) => {
    expect(DatakitConfigSchema.safeParse(pluginData.config).error).toBeUndefined()
  })

  it.each(codeOnlyFixtures)('$id is rejected by the compat schema', ({ id, pluginData }) => {
    const { success, error } = DatakitConfigCompatSchema.safeParse(pluginData.config)
    expect(success).toBe(false)
    expect(error!.issues.map(({ message }) => message)).toContain(CODE_ONLY_EXAMPLES[id])
  })

  describe.each(flowFixtures)('$id in the flow editor', ({ pluginData }) => {
    it('is accepted by the compat schema', () => {
      expect(DatakitConfigCompatSchema.safeParse(pluginData.config).error).toBeUndefined()
    })

    it('loads into a valid graph', () => {
      const { store } = createTestStore(pluginData)
      expect(store.validateGraph()).toEqual({ ok: true })
    })

    it('serializes back to the same config', () => {
      const { store } = createTestStore(pluginData)
      const output = toPluginData(store, pluginData)

      expect(output.config).toEqual(pluginData.config)
    })

    it('produces output accepted by the strict schema', () => {
      const { store } = createTestStore(pluginData)
      const output = toPluginData(store, pluginData)

      expect(DatakitConfigSchema.safeParse(output.config).error).toBeUndefined()
    })

    it('is stable when reloading its own output', () => {
      const first = toPluginData(createTestStore(pluginData).store, pluginData)
      const second = toPluginData(createTestStore(first).store, first)

      expect(second).toEqual(first)
    })
  })
})
