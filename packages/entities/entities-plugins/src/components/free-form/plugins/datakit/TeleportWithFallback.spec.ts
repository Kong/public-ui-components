import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import TeleportWithFallback from './TeleportWithFallback.vue'

const TARGET_ID = 'plugin-form-page-actions'
const CONTENT_TEST_ID = 'teleported-content'

function mountHost(withTarget: boolean) {
  const errors: unknown[] = []
  const showContent = ref(true)

  const Host = defineComponent({
    setup() {
      return () => h('div', [
        withTarget ? h('div', { id: TARGET_ID }) : null,
        showContent.value
          ? h(
            TeleportWithFallback,
            { to: `#${TARGET_ID}` },
            { default: () => h('button', { 'data-testid': CONTENT_TEST_ID }, 'Mode') },
          )
          : null,
      ])
    },
  })

  const wrapper = mount(Host, {
    attachTo: document.body,
    global: {
      config: {
        errorHandler: (error) => errors.push(error),
      },
    },
  })

  return { errors, showContent, wrapper }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('TeleportWithFallback', () => {
  it('teleports without update errors when the target mounts in the same component tree', async () => {
    const { errors, showContent, wrapper } = mountHost(true)

    await nextTick()

    expect(errors).toEqual([])
    const target = wrapper.get(`#${TARGET_ID}`)
    expect(target.get(`[data-testid="${CONTENT_TEST_ID}"]`).text()).toBe('Mode')

    showContent.value = false
    await nextTick()

    expect(target.find(`[data-testid="${CONTENT_TEST_ID}"]`).exists()).toBe(false)
    expect(errors).toEqual([])
  })

  it('renders the content inline when the target is unavailable', async () => {
    const { errors, wrapper } = mountHost(false)

    await nextTick()

    expect(wrapper.get(`[data-testid="${CONTENT_TEST_ID}"]`).text()).toBe('Mode')
    expect(errors).toEqual([])
  })
})
