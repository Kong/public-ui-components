import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Form from '../components/Form.vue'
import { useField } from './field'

import type { FormSchema } from '../form-schema'
import type { FormConfig } from '../types'

type FieldResult = Extract<ReturnType<typeof useField>, { versionInfo: unknown }>

/** Mounts `useField(name)` as a child of `Form`, so it can read the provided form context. */
function mountUseField(options: {
  name: string
  schema: FormSchema
  config?: FormConfig
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
        { schema: options.schema, config: options.config },
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
})
