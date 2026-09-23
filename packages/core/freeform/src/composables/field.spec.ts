import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Form from '../components/Form.vue'
import { useField } from './field'

import type { FormSchema } from '../form-schema'
import type { ChangeSource, FormConfig } from '../types'

type FieldResult = Extract<ReturnType<typeof useField>, { versionInfo: unknown }>

/** Mounts `useField(name)` as a child of `Form`, so it can read the provided form context. */
function mountUseField(options: {
  name: string
  schema: FormSchema
  config?: FormConfig
  onChange?: (value: unknown, source: ChangeSource) => void
}): FieldResult {
  let captured: FieldResult | undefined

  const Probe = defineComponent({
    setup() {
      captured = useField(options.name) as FieldResult
      return () => null
    },
  })

  mount(defineComponent({
    setup() {
      return () => h(
        Form,
        { schema: options.schema, config: options.config, onChange: options.onChange },
        { default: () => h(Probe) },
      )
    },
  }))

  return captured!
}

describe('useField', () => {
  describe('versionInfo', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [
        { gated_field: { type: 'string', min_ai_gateway_version: '2.1' } },
        { plain_field: { type: 'string' } },
      ],
    }

    it('is set when the field schema exceeds minRuntimeVersion', () => {
      const field = mountUseField({ name: 'gated_field', schema, config: { minRuntimeVersion: '2.0' } })

      expect(field.versionInfo.value?.tooltip).toContain('2.1')
    })

    it('is undefined when minRuntimeVersion satisfies the requirement', () => {
      const field = mountUseField({ name: 'gated_field', schema, config: { minRuntimeVersion: '2.1' } })

      expect(field.versionInfo.value).toBeUndefined()
    })

    it('fails open (undefined) when minRuntimeVersion is not provided', () => {
      const field = mountUseField({ name: 'gated_field', schema })

      expect(field.versionInfo.value).toBeUndefined()
    })

    it('is undefined for a field with no min_ai_gateway_version', () => {
      const field = mountUseField({ name: 'plain_field', schema, config: { minRuntimeVersion: '2.0' } })

      expect(field.versionInfo.value).toBeUndefined()
    })
  })

  describe('setSilently', () => {
    const schema: FormSchema = {
      type: 'record',
      fields: [{ plain_field: { type: 'string' } }],
    }

    it('writes the value like a normal assignment', () => {
      const field = mountUseField({ name: 'plain_field', schema })

      field.setSilently!('written silently')

      expect(field.value.value).toBe('written silently')
    })

    it('tags the resulting `Form` change as `init` rather than `user`', async () => {
      const onChange = vi.fn()
      const field = mountUseField({ name: 'plain_field', schema, onChange })

      onChange.mockClear() // drop the initial-hydration call

      field.setSilently!('written silently')
      await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))

      expect(onChange).toHaveBeenCalledWith({ plain_field: 'written silently' }, 'init')
    })

    it('is `user` for an ordinary write to `value`, for comparison', async () => {
      const onChange = vi.fn()
      const field = mountUseField({ name: 'plain_field', schema, onChange })

      onChange.mockClear() // drop the initial-hydration call

      field.value.value = 'typed by the user'
      await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))

      expect(onChange).toHaveBeenCalledWith({ plain_field: 'typed by the user' }, 'user')
    })
  })
})
