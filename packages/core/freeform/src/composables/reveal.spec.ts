/* eslint-disable vue/one-component-per-file -- each case mounts a small probe component */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Fragment, defineComponent, getCurrentInstance, h } from 'vue'
import { getVNodeElement, toDataPath, toFieldPath } from './reveal'
import { buildSchemaMap, generalizePath } from './schema'

import type { ComponentInternalInstance, VNodeChild } from 'vue'
import type { FormSchema } from '../form-schema'
import type { KeyId } from '../types'

describe('toFieldPath / toDataPath', () => {
  const schema: FormSchema = {
    type: 'record',
    fields: [
      { headers: { type: 'map', keys: { type: 'string' }, values: { type: 'string' } } },
      {
        providers: {
          type: 'map',
          keys: { type: 'string' },
          values: { type: 'record', fields: [{ model: { type: 'string' } }] },
        },
      },
      { limits: { type: 'array', elements: { type: 'record', fields: [{ window: { type: 'integer' } }] } } },
    ],
  }
  const schemaMap = buildSchemaMap(schema)
  const getSchema = (path: string) => schemaMap[generalizePath(path, schemaMap)]

  // The form data as the form keeps it: map entries keyed by key IDs
  const keys: Record<KeyId, string> = {
    'kid:1': 'X-Request-Id',
    'kid:2': 'x.y',
    'kid:3': 'openai',
  }
  const getKey = (id: KeyId) => keys[id]
  const formData = {
    headers: { 'kid:1': 'abc', 'kid:2': 'dotted' },
    providers: { 'kid:3': { model: 'gpt' } },
    limits: [{ window: 60 }],
  }
  const options = { formData, getSchema, getKey }

  it.each([
    [['headers', 'X-Request-Id'], 'headers.kid:1'],
    [['headers', 'x.y'], 'headers.kid:2'],
    [['providers', 'openai', 'model'], 'providers.kid:3.model'],
    [['limits', '0', 'window'], 'limits.0.window'],
  ])('should map %j to the field path %s', (segments, fieldPath) => {
    expect(toFieldPath(segments, options)).toBe(fieldPath)
  })

  it('should keep a map key that is not in the data, so it matches no field', () => {
    expect(toFieldPath(['headers', 'missing'], options)).toBe('headers.missing')
  })

  it.each([
    ['headers.kid:1', 'headers.X-Request-Id'],
    ['headers.kid:2', 'headers["x.y"]'],
    ['providers.kid:3.model', 'providers.openai.model'],
    ['limits.0.window', 'limits.0.window'],
  ])('should map the field path %s back to %s', (fieldPath, dataPath) => {
    expect(toDataPath(fieldPath, getKey)).toBe(dataPath)
  })
})

describe('getVNodeElement', () => {
  /**
   * Mounts `render` as a component followed by a sibling element, and returns
   * the element `getVNodeElement` finds for that component.
   */
  function elementOf(render: () => VNodeChild) {
    let instance: ComponentInternalInstance | null = null
    const Probe = defineComponent({
      setup() {
        instance = getCurrentInstance()
        return render
      },
    })
    const wrapper = mount(() => h('div', [h(Probe), h('input', { id: 'next-field' })]), { attachTo: document.body })
    const element = getVNodeElement(instance!.subTree)
    wrapper.unmount()
    return element
  }

  it('should return the root element', () => {
    expect(elementOf(() => h('section', { id: 'root' }))?.id).toBe('root')
  })

  it('should return the first element of a fragment', () => {
    expect(elementOf(() => h(Fragment, [null, h('section', { id: 'first' }), h('span')]))?.id).toBe('first')
  })

  it('should look into a component root', () => {
    const Inner = defineComponent({ render: () => h(Fragment, [null, h('section', { id: 'inner' })]) })
    expect(elementOf(() => h(Inner))?.id).toBe('inner')
  })

  it('should return null for a component that renders nothing', () => {
    expect(elementOf(() => null)).toBeNull()
  })

  it('should not cross the end of a fragment that renders no element', () => {
    expect(elementOf(() => h(Fragment, [null, 'text']))).toBeNull()
  })
})
