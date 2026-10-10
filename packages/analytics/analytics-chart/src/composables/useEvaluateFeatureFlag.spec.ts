import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import useEvaluateFeatureFlag from './useEvaluateFeatureFlag'
import { INJECT_QUERY_PROVIDER } from '../constants'

const mountComposable = (queryBridge?: Record<string, unknown>) => {
  const wrapper = mount(defineComponent({
    setup() {
      return useEvaluateFeatureFlag()
    },
    template: '<div />',
  }), {
    global: {
      provide: queryBridge === undefined ? {} : {
        [INJECT_QUERY_PROVIDER]: queryBridge,
      },
    },
  })

  return wrapper
}

describe('useEvaluateFeatureFlag', () => {
  it('falls back to the default value when no query bridge is provided', () => {
    const wrapper = mountComposable()

    expect(wrapper.vm.evaluateFeatureFlag('some-flag', true)).toBe(true)
    expect(wrapper.vm.evaluateFeatureFlag('some-flag', false)).toBe(false)
  })

  it('falls back to the default value when the query bridge has no evaluateFeatureFlagFn', () => {
    const wrapper = mountComposable({
      queryFn: () => {},
      requestsQueryFn: () => {},
      datasourceConfigFn: () => {},
    })

    expect(wrapper.vm.evaluateFeatureFlag('some-flag', true)).toBe(true)
    expect(wrapper.vm.evaluateFeatureFlag('some-flag', false)).toBe(false)
  })

  it('delegates to the query bridge when evaluateFeatureFlagFn is present', () => {
    const evaluateFeatureFlagFn = (key: string, defaultValue: boolean) => key === 'enabled-flag' ? true : defaultValue
    const wrapper = mountComposable({ evaluateFeatureFlagFn })

    expect(wrapper.vm.evaluateFeatureFlag('enabled-flag', false)).toBe(true)
    expect(wrapper.vm.evaluateFeatureFlag('other-flag', false)).toBe(false)
  })
})
