import yaml from 'js-yaml'
import { describe, expect, it, vi } from 'vitest'
import { useSkipDefaults } from './skip-defaults'

describe('useSkipDefaults', () => {
  it('keeps top-level config and enabled when defaults are skipped', () => {
    const getValue = vi.fn(() => ({
      name: 'rate-limiting',
      enabled: true,
      config: {
        minute: 5,
      },
      protocols: ['http'],
    }))

    const setValue = vi.fn()

    const { skipDefaults, toCode } = useSkipDefaults({
      getValue,
      setValue,
      getDefaultFromSchema: () => ({
        enabled: true,
        config: {
          minute: 5,
        },
        protocols: ['http'],
      }),
    })

    skipDefaults.value = true

    expect(yaml.load(toCode())).toEqual({
      name: 'rate-limiting',
      enabled: true,
      config: {},
    })
  })

  it('keeps top-level config while stripping only nested defaults', () => {
    const getValue = vi.fn(() => ({
      name: 'rate-limiting',
      enabled: true,
      config: {
        minute: 10,
        policy: 'local',
      },
    }))

    const setValue = vi.fn()

    const { skipDefaults, toCode } = useSkipDefaults({
      getValue,
      setValue,
      getDefaultFromSchema: () => ({
        enabled: true,
        config: {
          minute: 5,
          policy: 'local',
        },
      }),
    })

    skipDefaults.value = true

    expect(yaml.load(toCode())).toEqual({
      name: 'rate-limiting',
      enabled: true,
      config: {
        minute: 10,
      },
    })
  })
})
