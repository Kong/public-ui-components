import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RedisConfigurationForm from './RedisConfigurationForm.vue'
import type { KonnectRedisConfigurationFormConfig, KongManagerRedisConfigurationFormConfig } from '../types'

// In‑memory router so the form can call useRouter() without errors
const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

// Helpers for the two config types
const konnect = (overrides: Partial<KonnectRedisConfigurationFormConfig> = {}): KonnectRedisConfigurationFormConfig => ({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId: 'test-cp',
  ...overrides,
})

const kongManager = (): KongManagerRedisConfigurationFormConfig => ({
  app: 'kongManager',
  apiBaseUrl: '/kong-manager',
  workspace: 'default',
})

// We don’t want to pull in Kongponents or other child components here.
// So sttubing them all, and let EntityBaseForm render its own actions.
const stubs = {
  EntityBaseForm: { template: '<div><slot /></div>' },
  EntityFormBlock: true,
  EntityFormSection: true,
  KAlert: true,
  KSelect: true,
  KInput: true,
  KCheckbox: true,
  KButton: true,
  KModal: true,
  KCard: true,
  VaultSecretPicker: true,
  VaultSecretPickerProvider: true,
  CloudAuthFields: true,
  SentinelNodes: true,
  ClusterNodes: true,
  i18nT: true,
}

const mountForm = (config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig) =>
  mount(RedisConfigurationForm, {
    props: { config },
    global: { plugins: [router], stubs },
  })

describe('RedisConfigurationForm', () => {
  it('adds managed-konnect-layout class when Konnect + isKonnectManagedRedisEnabled', () => {
    const wrapper = mountForm(konnect({ isKonnectManagedRedisEnabled: true }))
    expect(wrapper.find('.kong-ui-entities-redis-configurations-form').classes()).toContain('managed-konnect-layout')
  })

  it('no managed layout when isKonnectManagedRedisEnabled is false or unset', () => {
    expect(mountForm(konnect()).find('.managed-konnect-layout').exists()).toBe(false)
    expect(mountForm(konnect({ isKonnectManagedRedisEnabled: false })).find('.managed-konnect-layout').exists()).toBe(false)
  })

  it('no managed layout for Kong Manager', () => {
    const wrapper = mountForm(kongManager())
    expect(wrapper.find('.managed-konnect-layout').exists()).toBe(false)
  })
})
