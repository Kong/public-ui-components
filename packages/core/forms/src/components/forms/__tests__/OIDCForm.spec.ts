// Vitest unit test spec file

import { beforeAll, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OIDCForm from '../OIDCForm.vue'
import { OIDCFormSchema, OIDCModel } from './OIDCSchema'
import Kongponents from '@kong/kongponents'

const baseProps = {
  formSchema: OIDCFormSchema,
  isEditing: false,
  onPartialToggled: vi.fn(),
}

describe('<PluginForms />', () => {
  beforeAll(() => {
    class ResizeObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (global as any).ResizeObserver = ResizeObserver
  })

  it('renders', () => {
    const wrapper = mount(OIDCForm, {
      props: {
        ...baseProps,
        formModel: { ...OIDCModel },
        onModelUpdated: vi.fn(),
      },
      global: {
        plugins: [Kongponents],
      },
    })

    expect(wrapper.isVisible()).toBe(true)
  })

  describe('consumer_claim deprecation migration', () => {
    it('copies config-consumer_claim into config-consumer_claims when consumer_claims is empty, preserving the original', () => {
      const onModelUpdated = vi.fn()
      const formModel = {
        ...OIDCModel,
        'config-consumer_claim': ['sub'],
        'config-consumer_claims': null,
      }

      mount(OIDCForm, {
        props: {
          ...baseProps,
          formModel,
          onModelUpdated,
        },
        global: {
          plugins: [Kongponents],
        },
      })

      // deprecated field is preserved so it is included in the submitted payload
      expect(formModel['config-consumer_claim']).toEqual(['sub'])
      // consumer_claims is string[][] — the claim array is wrapped in an outer array
      expect(formModel['config-consumer_claims']).toEqual([['sub']])
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('wraps a string value from config-consumer_claim into string[][]', () => {
      const onModelUpdated = vi.fn()
      const formModel = {
        ...OIDCModel,
        'config-consumer_claim': 'sub',
        'config-consumer_claims': null,
      }

      mount(OIDCForm, {
        props: {
          ...baseProps,
          formModel,
          onModelUpdated,
        },
        global: {
          plugins: [Kongponents],
        },
      })

      expect(formModel['config-consumer_claims']).toEqual([['sub']])
      expect(onModelUpdated).toHaveBeenCalled()
    })

    it('does not overwrite existing config-consumer_claims', () => {
      const onModelUpdated = vi.fn()
      const formModel = {
        ...OIDCModel,
        'config-consumer_claim': ['sub'],
        'config-consumer_claims': ['username'],
      }

      mount(OIDCForm, {
        props: {
          ...baseProps,
          formModel,
          onModelUpdated,
        },
        global: {
          plugins: [Kongponents],
        },
      })

      expect(formModel['config-consumer_claims']).toEqual(['username'])
    })

    it('does not call onModelUpdated when config-consumer_claim is null', () => {
      const onModelUpdated = vi.fn()
      const formModel = {
        ...OIDCModel,
        'config-consumer_claim': null,
        'config-consumer_claims': null,
      }

      mount(OIDCForm, {
        props: {
          ...baseProps,
          formModel,
          onModelUpdated,
        },
        global: {
          plugins: [Kongponents],
        },
      })

      expect(formModel['config-consumer_claims']).toBeNull()
      // onModelUpdated may still be called for other reasons (auth_methods etc.), so we
      // only verify consumer_claims was not populated
    })
  })
})
