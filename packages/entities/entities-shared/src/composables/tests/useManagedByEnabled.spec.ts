/* eslint-disable vue/one-component-per-file -- the harness needs a provider wrapping a consumer */
import { describe, it, expect } from 'vitest'
import { defineComponent, h, ref, provide } from 'vue'
import { mount } from '@vue/test-utils'
import useManagedByEnabled from '../useManagedByEnabled'
import { ENTITIES_FEATURE_FLAGS } from '../../constants'

/** Sentinel meaning "the host never called provide() at all". */
const NOT_PROVIDED = Symbol('NOT_PROVIDED')

/** Renders the resolved flag so we can assert on it, optionally providing a value first. */
const mountWithFlag = (provided: unknown = NOT_PROVIDED) => {
  const Child = defineComponent({
    setup() {
      const enabled = useManagedByEnabled()
      return () => h('div', String(enabled.value))
    },
  })

  const Parent = defineComponent({
    setup() {
      if (provided !== NOT_PROVIDED) {
        provide(ENTITIES_FEATURE_FLAGS.MANAGED_BY, provided)
      }
      return () => h(Child)
    },
  })

  return mount(Parent)
}

describe('useManagedByEnabled', () => {
  it('defaults to false when the host provides nothing', () => {
    expect(mountWithFlag().text()).toBe('false')
  })

  it('reads a plain boolean', () => {
    expect(mountWithFlag(true).text()).toBe('true')
    expect(mountWithFlag(false).text()).toBe('false')
  })

  it('unwraps a ref', () => {
    expect(mountWithFlag(ref(true)).text()).toBe('true')
  })

  it('tracks a ref that flips after mount', async () => {
    const flag = ref(false)
    const wrapper = mountWithFlag(flag)
    expect(wrapper.text()).toBe('false')

    flag.value = true
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('true')
  })

  it('coerces nullish provided values to false', () => {
    expect(mountWithFlag(undefined).text()).toBe('false')
    expect(mountWithFlag(null).text()).toBe('false')
  })
})
