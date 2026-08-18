/* eslint-disable vue/one-component-per-file */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { providePluginContext, usePluginContext } from '.'

declare module '.' {
  interface PluginContextRegistry {
    'test-plugin-a': { foo: string }
    'test-plugin-b': { bar: number }
  }
}

function mountWithProvider(setup: () => void, slotSetup: () => unknown) {
  const Child = defineComponent({
    setup: slotSetup,
    render: () => null,
  })

  const Parent = defineComponent({
    setup() {
      setup()
      return () => h(Child)
    },
  })

  return mount(Parent)
}

describe('providePluginContext / usePluginContext', () => {
  it('lets a descendant read context registered by an ancestor', () => {
    let received: { foo: string } | undefined

    mountWithProvider(
      () => providePluginContext('test-plugin-a', { foo: 'hello' }),
      () => {
        received = usePluginContext('test-plugin-a')
      },
    )

    expect(received).toEqual({ foo: 'hello' })
  })

  it('merges multiple calls in the same component instead of clobbering earlier ones', () => {
    let receivedA: { foo: string } | undefined
    let receivedB: { bar: number } | undefined

    mountWithProvider(
      () => {
        providePluginContext('test-plugin-a', { foo: 'hello' })
        providePluginContext('test-plugin-b', { bar: 42 })
      },
      () => {
        receivedA = usePluginContext('test-plugin-a')
        receivedB = usePluginContext('test-plugin-b')
      },
    )

    expect(receivedA).toEqual({ foo: 'hello' })
    expect(receivedB).toEqual({ bar: 42 })
  })

  it('warns and returns undefined when nothing was registered for the requested plugin', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let received: unknown

    mountWithProvider(
      () => providePluginContext('test-plugin-a', { foo: 'hello' }),
      () => {
        received = usePluginContext('test-plugin-b')
      },
    )

    expect(received).toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no context registered for plugin "test-plugin-b"'))
    warnSpy.mockRestore()
  })

  it('stays silent and returns undefined when no ancestor ever provided any context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let received: unknown

    mountWithProvider(
      () => {},
      () => {
        received = usePluginContext('test-plugin-a')
      },
    )

    expect(received).toBeUndefined()
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('throws when called outside setup()', () => {
    expect(() => providePluginContext('test-plugin-a', { foo: 'hello' })).toThrow('must be called inside setup()')
  })
})
