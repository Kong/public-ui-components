import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ChartTooltip from './ChartTooltip.vue'

describe('ChartTooltip', () => {
  it('removes the no-select class from body on unmount', () => {
    document.body.classList.add('no-select')

    const wrapper = shallowMount(ChartTooltip, {
      props: {
        state: {
          interactionMode: 'interactive',
          entries: [],
          visible: true,
          top: 0,
          left: 0,
        },
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })

    wrapper.unmount()

    expect(document.body.classList.contains('no-select')).toBe(false)
  })
})
