import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FieldObjectAdvanced from '../FieldObjectAdvanced.vue'

const schema = {
  type: 'object-advanced',
  model: 'config-limits',
}

describe('FieldObjectAdvanced', () => {
  describe('transformMapModelValuesToObject', () => {
    it('simple string field model', async () => {
      const wrapper = mount(FieldObjectAdvanced, {
        props: {
          model: {
            'config-limits-header1': 'X-Gruce-Auth',
            'config-limits-header-2': 'X-Gruce-Limit',
          },
          schema,
        },
      })

      const { vm } = wrapper

      expect(vm.transformMapModelValuesToObject(vm.model, [], vm.schema.model))
        .to.eql({ header1: 'X-Gruce-Auth', 'header-2': 'X-Gruce-Limit' })
    })

    it('handles sub schema', async () => {
      const wrapper = mount(FieldObjectAdvanced, {
        props: {
          model: {
            'config-limits-consumer1-second': '10',
            'config-limits-consumer1-hour': '300',
            'config-limits-consumer-with-hyphens-hour': '1',
          },
          schema: {
            ...schema,
            schema: {
              fields: [
                {
                  type: 'object',
                  model: 'object',
                  schema: {
                    fields:
                    [
                      { model: 'second', type: 'input', inputType: 'number' },
                      { model: 'hour', type: 'input', inputType: 'number' },
                    ],
                  },
                }],
            },
          },
        },
      })

      const { vm } = wrapper

      expect(vm.transformMapModelValuesToObject(vm.model, vm.subSchema.fields, vm.schema.model))
        .to.eql({ consumer1: { second: '10', hour: '300' }, 'consumer-with-hyphens': { hour: '1' } })
    })

    it('handles map key correctly', async () => {
      const wrapper = mount(FieldObjectAdvanced, {
        props: {
          model: {
            'healthchecks-active-headers-foo': ['aaa', '111'],
            'healthchecks-active-headers-foo-bar': ['bbb', '222'],
          },
          schema: {
            type: 'object-advanced',
            keys: { type: 'string' },
            values: { type: 'array', elements: { type: 'string' } },
            required: false,
            id: 'healthchecks-active-headers',
            model: 'healthchecks-active-headers',
            schema: {
              fields: [
                {
                  schema: {
                    fields: [
                      {
                        type: 'array',
                        valueType: 'string',
                        valueArrayType: 'string',
                        itemContainerComponent: 'FieldArrayItem',
                        fieldClasses: 'w-100',
                        fieldItemsClasses: 'd-flex mt-2 w-90',
                        inputAttributes: {
                          class: 'form-control',
                          style: { minWidth: '200px' },
                          type: 'text',
                          inputMode: 'text',
                        },
                        validator: 'array',
                        styleClasses: 'w-100',
                        newElementButtonLabel: '+ Add',
                        newElementButtonLabelClasses: 'my-5',
                        model: 'healthchecks-active-headers',
                      },
                    ],
                  },
                },
              ],
            },
            label: 'Healthchecks.Active.Headers',
            order: 0,
            disabled: false,
          },

        },
      })

      const { vm } = wrapper

      expect(vm.transformMapModelValuesToObject(vm.model, vm.subSchema.fields, vm.schema.model))
        .to.eql({ foo: ['aaa', '111'], 'foo-bar': ['bbb', '222'] })
    })
  })

  describe('handles hardcoded schema', () => {
    it('renders field correctly', () => {
      const wrapper = mount(FieldObjectAdvanced, {
        props: {
          model: {
            headers: {},
          },
          schema: {
            headers: {
              label: 'Headers',
              type: 'object-advanced',
              placeholder: 'Enter header name',
              fields: [{
                schema: {
                  type: 'input',
                  inputType: 'text',
                  valueType: 'array',
                  placeholder: 'Comma separated list of header values',
                },
              }],
            },
          },
        },
      })

      expect(wrapper.find('input[data-testid="keyname-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="add-key"]').exists()).toBe(true)
    })
  })
})
