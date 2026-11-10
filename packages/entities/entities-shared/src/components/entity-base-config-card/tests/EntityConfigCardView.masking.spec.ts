import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import Kongponents from '@kong/kongponents'
import EntityConfigCardView from '../EntityConfigCardView.vue'
import ConfigCardDisplay from '../ConfigCardDisplay.vue'
import ConfigCardItem from '../ConfigCardItem.vue'
import { useSchemaProvider } from '../../../composables/useSchema'
import { ConfigurationSchemaType } from '../../../types'

import type { App, Component, VNode } from 'vue'

// Kongponents observe element sizes; jsdom has no ResizeObserver
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

const encryptedRecord = (name: string) => ({ [name]: { type: 'record', fields: [{ token: { type: 'string', encrypted: true } }] } })

let app: App | undefined
afterEach(() => app?.unmount())

async function mountView(props: Record<string, any>, slots: Record<string, (props: any) => VNode> = {}) {
  const el = document.createElement('div')
  app = createApp({ render: () => h(EntityConfigCardView as Component, props, slots) }).use(Kongponents)
  app.mount(el)
  await nextTick()
  return (key: string) => el.querySelector(`[data-testid="${key}-property-value"]`)?.textContent ?? ''
}

describe('EntityConfigCardView structured masking', () => {
  it('masks nested root fields when the Plugin section is enabled', async () => {
    const value = await mountView({
      record: { id: 'plugin', credentials: { token: 'root-secret' }, config: { auth: { token: 'plugin-secret' } } },
      schema: { fields: [encryptedRecord('credentials'), { config: { type: 'record', fields: [encryptedRecord('auth')] } }] },
      configSchema: { credentials: { type: ConfigurationSchemaType.Json } },
      pluginConfigKey: 'config',
      pluginConfigSchema: { auth: { type: ConfigurationSchemaType.Json } },
    })
    expect(value('credentials')).toMatch(/\*{3,}/)
    expect(value('credentials')).not.toContain('root-secret')
    expect(value('auth')).toMatch(/\*{3,}/)
    expect(value('auth')).not.toContain('plugin-secret')
  })

  it('masks nested Policy fields', async () => {
    const value = await mountView({
      record: { id: 'policy', policy: { auth: { token: 'policy-secret' } } },
      schema: { fields: [{ policy: { type: 'record', fields: [encryptedRecord('auth')] } }] },
      policyConfigKey: 'policy',
      policyConfigSchema: { auth: { type: ConfigurationSchemaType.Json } },
    })
    expect(value('auth')).toMatch(/\*{3,}/)
    expect(value('auth')).not.toContain('policy-secret')
  })

  it('masks rows rendered through a whole-row slot with their source schema', async () => {
    const value = await mountView({
      record: { id: 'plugin', config: { auth: { token: 'row-slot-secret' } } },
      schema: { fields: [{ config: { type: 'record', fields: [encryptedRecord('auth')] } }] },
      pluginConfigKey: 'config',
      pluginConfigSchema: { auth: { type: ConfigurationSchemaType.Json } },
    }, {
      'config-card-item-auth': ({ row }: { row: any }) => h(ConfigCardItem, { item: row }),
    })
    expect(value('auth')).toMatch(/\*{3,}/)
    expect(value('auth')).not.toContain('row-slot-secret')
  })

  it('keeps the schema provided to a standalone ConfigCardDisplay nested in the View', async () => {
    // A host component in the View's actions slot that provides its own schema to a Display
    const NestedDisplay = defineComponent(() => {
      useSchemaProvider(ref({ fields: [encryptedRecord('inner')] }))
      return () => h(ConfigCardDisplay, {
        format: 'structured',
        propListTypes: ['basic'],
        propertyCollections: { basic: [{ key: 'inner', label: 'Inner', value: { token: 'nested-secret' }, type: ConfigurationSchemaType.Json }] },
      })
    })
    const value = await mountView({ record: { id: 'outer' } }, { actions: () => h(NestedDisplay) })
    expect(value('inner')).toMatch(/\*{3,}/)
    expect(value('inner')).not.toContain('nested-secret')
  })
})
