// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OIDCForm from '../OIDCForm.vue'
import { OIDCFormSchema, OIDCModel } from './OIDCSchema'

describe('<PluginForms />', () => {
  it('renders', () => {
    const wrapper = mount(OIDCForm, {
      props: {
        formSchema: OIDCFormSchema,
        formModel: OIDCModel,
      },
    })

    expect(wrapper.isVisible()).toBe(true)
  })
})
