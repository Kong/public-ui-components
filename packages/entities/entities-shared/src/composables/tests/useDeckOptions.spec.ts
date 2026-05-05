/* eslint-disable vue/one-component-per-file */

import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

import { DECK_COMMAND_EDITOR_KEY } from '../../constants'
import { SupportedEntityType } from '../../types'
import { useBaseEntityDeckOptions, useBaseFormDeckOptions } from '../useDeckOptions'

import type { DeckCommandEditor } from '../../deck-editor'
import type {
  DeckConfigOptions,
  KongManagerBaseEntityConfig,
  KongManagerBaseFormConfig,
  KonnectBaseEntityConfig,
  KonnectBaseFormConfig,
} from '../../types'

function withSetup<T>(fn: () => T, providedEditor?: typeof DeckCommandEditor): T {
  let result!: T
  const app = createApp(defineComponent({
    setup() {
      result = fn()
      return () => h('div')
    },
  }))
  if (providedEditor) {
    app.provide(DECK_COMMAND_EDITOR_KEY, providedEditor)
  }
  app.mount(document.createElement('div'))
  return result
}

const STUB_EDITOR: typeof DeckCommandEditor = defineComponent({ render: () => null })

const konnectEntityBase = {
  app: 'konnect',
  apiBaseUrl: '/',
  controlPlaneId: 'cp-1',
  entityId: 'e-1',
} satisfies KonnectBaseEntityConfig

const kongManagerEntityBase = {
  app: 'kongManager',
  apiBaseUrl: '/',
  workspace: 'default',
  entityId: 'e-1',
} satisfies KongManagerBaseEntityConfig

const konnectFormBase = {
  app: 'konnect',
  apiBaseUrl: '/',
  controlPlaneId: 'cp-1',
} satisfies KonnectBaseFormConfig

const kongManagerFormBase = {
  app: 'kongManager',
  apiBaseUrl: '/',
  workspace: 'default',
} satisfies KongManagerBaseFormConfig

describe('useBaseEntityDeckOptions()', () => {
  describe('isDeckEnabled', () => {
    it('returns false when the entity type is not supported by decK', () => {
      const { isDeckEnabled } = withSetup(() => useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.Other,
      ))

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Kong Manager on a supported entity', () => {
      const { isDeckEnabled } = withSetup(() => useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.GatewayService,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is disabled for Konnect without `enableDeckConfig`', () => {
      const { isDeckEnabled } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase },
        SupportedEntityType.GatewayService,
      ))

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Konnect with `enableDeckConfig: true`', () => {
      const { isDeckEnabled } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is enabled for Konnect with an `enableDeckConfig` object', () => {
      const { isDeckEnabled } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: {} },
        SupportedEntityType.GatewayService,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })
  })

  describe('deckCustomizationOptions', () => {
    it('is undefined for Kong Manager', () => {
      const { deckCustomizationOptions } = withSetup(() => useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('is undefined when `enableDeckConfig` is a boolean', () => {
      const { deckCustomizationOptions } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('returns the nested `customization` field when a `DeckCommandEditor` is provided', () => {
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = withSetup(
        () => useBaseEntityDeckOptions(
          { ...konnectEntityBase, enableDeckConfig: { customization } },
          SupportedEntityType.GatewayService,
        ),
        STUB_EDITOR,
      )

      expect(deckCustomizationOptions.value).toBe(customization)
    })

    it('returns undefined and warns when customization is configured but no `DeckCommandEditor` is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: { customization } },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DeckCommandEditor'))
      warnSpy.mockRestore()
    })
  })

  describe('deckCalloutPreferenceKey', () => {
    it('returns `deckCalloutPreferenceKey` for Kong Manager configs', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseEntityDeckOptions(
        { ...kongManagerEntityBase, deckCalloutPreferenceKey: 'km-key' },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCalloutPreferenceKey.value).toBe('km-key')
    })

    it('returns the nested `calloutPreferenceKey` for Konnect configs', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: { calloutPreferenceKey: 'konnect-key' } },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCalloutPreferenceKey.value).toBe('konnect-key')
    })

    it('is undefined when Konnect `enableDeckConfig` is a boolean', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      ))

      expect(deckCalloutPreferenceKey.value).toBeUndefined()
    })
  })

  it('reacts to config and entity type updates', () => {
    const config = ref<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>({ ...konnectEntityBase })
    const entityType = ref(SupportedEntityType.Other)

    const { isDeckEnabled, deckCalloutPreferenceKey } = withSetup(() => useBaseEntityDeckOptions(config, entityType))

    expect(isDeckEnabled.value).toBe(false)

    entityType.value = SupportedEntityType.GatewayService
    expect(isDeckEnabled.value).toBe(false)

    config.value = { ...konnectEntityBase, enableDeckConfig: { calloutPreferenceKey: 'k' } }
    expect(isDeckEnabled.value).toBe(true)
    expect(deckCalloutPreferenceKey.value).toBe('k')

    config.value = { ...kongManagerEntityBase, deckCalloutPreferenceKey: 'km' }
    expect(isDeckEnabled.value).toBe(true)
    expect(deckCalloutPreferenceKey.value).toBe('km')
  })
})

describe('useBaseFormDeckOptions()', () => {
  describe('isDeckEnabled', () => {
    it('returns false when the entity type is not supported by decK', () => {
      const { isDeckEnabled } = withSetup(() => useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Other,
      ))

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Kong Manager on a supported entity', () => {
      const { isDeckEnabled } = withSetup(() => useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Plugin,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is disabled for Konnect without `enableDeckTab`', () => {
      const { isDeckEnabled } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase },
        SupportedEntityType.Plugin,
      ))

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Konnect with `enableDeckTab: true`', () => {
      const { isDeckEnabled } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is enabled for Konnect with an `enableDeckTab` object', () => {
      const options: DeckConfigOptions = {}
      const { isDeckEnabled } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: options },
        SupportedEntityType.Plugin,
      ))

      expect(isDeckEnabled.value).toBe(true)
    })
  })

  describe('deckCustomizationOptions', () => {
    it('is undefined for Kong Manager', () => {
      const { deckCustomizationOptions } = withSetup(() => useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Plugin,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('is undefined when `enableDeckTab` is a boolean', () => {
      const { deckCustomizationOptions } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('returns the nested `customization` field when a `DeckCommandEditor` is provided', () => {
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = withSetup(
        () => useBaseFormDeckOptions(
          { ...konnectFormBase, enableDeckTab: { customization } },
          SupportedEntityType.Plugin,
        ),
        STUB_EDITOR,
      )

      expect(deckCustomizationOptions.value).toBe(customization)
    })

    it('returns undefined and warns when customization is configured but no `DeckCommandEditor` is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: { customization } },
        SupportedEntityType.Plugin,
      ))

      expect(deckCustomizationOptions.value).toBeUndefined()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DeckCommandEditor'))
      warnSpy.mockRestore()
    })
  })

  describe('deckCalloutPreferenceKey', () => {
    it('returns `deckCalloutPreferenceKey` for Kong Manager configs', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseFormDeckOptions(
        { ...kongManagerFormBase, deckCalloutPreferenceKey: 'km-key' },
        SupportedEntityType.Plugin,
      ))

      expect(deckCalloutPreferenceKey.value).toBe('km-key')
    })

    it('returns the nested `calloutPreferenceKey` for Konnect configs', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: { calloutPreferenceKey: 'konnect-key' } },
        SupportedEntityType.Plugin,
      ))

      expect(deckCalloutPreferenceKey.value).toBe('konnect-key')
    })

    it('is undefined when Konnect `enableDeckTab` is a boolean', () => {
      const { deckCalloutPreferenceKey } = withSetup(() => useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      ))

      expect(deckCalloutPreferenceKey.value).toBeUndefined()
    })
  })
})
