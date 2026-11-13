import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import PluginEntityForm from '../PluginEntityForm.vue'
import { FEATURE_FLAGS } from '../../constants'
import schema from '../../../fixtures/schemas/acl'

describe('plugin form CEL rollout', () => {
  it('switches existing ACL rows together and loads only host-provided subjects', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    const enabled = ref(false)
    const getCelSubjects = vi.fn().mockResolvedValue({ consumerGroups: [{ id: 'g', name: 'team' }] })
    const wrapper = mount(PluginEntityForm, {
      props: {
        config: { app: 'konnect', apiBaseUrl: '', controlPlaneId: 'cp', getCelSubjects },
        pluginName: 'acl',
        rawSchema: schema,
        record: { config: { allow_when: ['true', 'false'] } },
      },
      global: {
        provide: { [FEATURE_FLAGS.KM_PLUGINS_CEL_EXPRESSION_EDITOR]: enabled },
        stubs: { VaultSecretPicker: true, MonacoEditor: true },
      },
    })

    try {
      const row = () => wrapper.get('[data-testid="ff-config.allow_when.0"]')
      expect(row().element.tagName).toBe('TEXTAREA')
      expect(getCelSubjects).not.toHaveBeenCalled()
      enabled.value = true
      await vi.waitFor(() => expect(wrapper.findAll('.cel-input')).toHaveLength(2))
      expect(getCelSubjects).toHaveBeenCalledTimes(1)
      expect(row().classes()).toContain('cel-input')
      expect(wrapper.find('[data-testid="ff-condition"]').exists()).toBe(false)

      enabled.value = false
      await flushPromises()
      expect(row().element.tagName).toBe('TEXTAREA')
      expect((row().element as HTMLTextAreaElement).value).toBe('true')
    } finally {
      wrapper.unmount()
      vi.unstubAllGlobals()
    }
  })
})
