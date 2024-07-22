// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OIDCForm from '../OIDCForm.vue'

describe('<PluginForms />', () => {
  it('renders', () => {
    const wrapper = mount(OIDCForm, {
      props: {
        formSchema: { fields: [] },
        formModel: {},
      },
    })

    expect(wrapper.isVisible()).toBe(true)
  })
})
