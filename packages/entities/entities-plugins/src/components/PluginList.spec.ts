import { flushPromises, shallowMount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PluginList from './PluginList.vue'

it.each([true, false])('exposes resolved create permission (%s) and preserves the fallback for empty slot content', async (allowed) => {
  const wrapper = shallowMount(PluginList, {
    props: {
      config: {
        app: 'konnect',
        apiBaseUrl: '/api',
        controlPlaneId: 'gateway',
        createRoute: '/create',
        getEditRoute: () => '/edit',
        getViewRoute: () => '/view',
        getConfigureDynamicOrderingRoute: () => '/ordering',
      },
      canCreate: async () => allowed,
    },
    slots: {
      'empty-state': '<template #empty-state="{ canCreate }"><button v-if="canCreate">Configure a plugin</button></template>',
    },
    global: {
      stubs: {
        EntityBaseTable: { template: '<div><slot name="toolbar-filter" /><slot name="empty-state" /></div>' },
        KEmptyState: true,
        KButton: true,
      },
    },
  })

  await flushPromises()
  expect(wrapper.find('button').exists()).toBe(allowed)
  expect(wrapper.findTestId('plugins-entity-empty-state').exists()).toBe(!allowed)

  wrapper.getComponent({ name: 'PluginFilter' }).vm.$emit('update:modelValue', 'name=acl')
  await wrapper.vm.$nextTick()
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.findTestId('plugins-entity-empty-state').exists()).toBe(false)
  wrapper.unmount()
})
