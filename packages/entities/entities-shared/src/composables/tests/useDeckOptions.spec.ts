import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useBaseEntityDeckOptions, useBaseFormDeckOptions } from '../useDeckOptions'
import { SupportedEntityType } from '../../types'

import type {
  DeckConfigOptions,
  KongManagerBaseEntityConfig,
  KongManagerBaseFormConfig,
  KonnectBaseEntityConfig,
  KonnectBaseFormConfig,
} from '../../types'

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
      const { isDeckEnabled } = useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.Other,
      )

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Kong Manager on a supported entity', () => {
      const { isDeckEnabled } = useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.GatewayService,
      )

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is disabled for Konnect without `enableDeckConfig`', () => {
      const { isDeckEnabled } = useBaseEntityDeckOptions(
        { ...konnectEntityBase },
        SupportedEntityType.GatewayService,
      )

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Konnect with `enableDeckConfig: true`', () => {
      const { isDeckEnabled } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      )

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is enabled for Konnect with an `enableDeckConfig` object', () => {
      const { isDeckEnabled } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: {} },
        SupportedEntityType.GatewayService,
      )

      expect(isDeckEnabled.value).toBe(true)
    })
  })

  describe('deckCustomizationOptions', () => {
    it('is undefined for Kong Manager', () => {
      const { deckCustomizationOptions } = useBaseEntityDeckOptions(
        { ...kongManagerEntityBase },
        SupportedEntityType.GatewayService,
      )

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('is undefined when `enableDeckConfig` is a boolean', () => {
      const { deckCustomizationOptions } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      )

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('returns the nested `customization` field', () => {
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: { customization } },
        SupportedEntityType.GatewayService,
      )

      expect(deckCustomizationOptions.value).toBe(customization)
    })
  })

  describe('deckCalloutPreferenceKey', () => {
    it('returns `deckCalloutPreferenceKey` for Kong Manager configs', () => {
      const { deckCalloutPreferenceKey } = useBaseEntityDeckOptions(
        { ...kongManagerEntityBase, deckCalloutPreferenceKey: 'km-key' },
        SupportedEntityType.GatewayService,
      )

      expect(deckCalloutPreferenceKey.value).toBe('km-key')
    })

    it('returns the nested `calloutPreferenceKey` for Konnect configs', () => {
      const { deckCalloutPreferenceKey } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: { calloutPreferenceKey: 'konnect-key' } },
        SupportedEntityType.GatewayService,
      )

      expect(deckCalloutPreferenceKey.value).toBe('konnect-key')
    })

    it('is undefined when Konnect `enableDeckConfig` is a boolean', () => {
      const { deckCalloutPreferenceKey } = useBaseEntityDeckOptions(
        { ...konnectEntityBase, enableDeckConfig: true },
        SupportedEntityType.GatewayService,
      )

      expect(deckCalloutPreferenceKey.value).toBeUndefined()
    })
  })

  it('reacts to config and entity type updates', () => {
    const config = ref<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>({ ...konnectEntityBase })
    const entityType = ref(SupportedEntityType.Other)

    const { isDeckEnabled, deckCalloutPreferenceKey } = useBaseEntityDeckOptions(config, entityType)

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
      const { isDeckEnabled } = useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Other,
      )

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Kong Manager on a supported entity', () => {
      const { isDeckEnabled } = useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Plugin,
      )

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is disabled for Konnect without `enableDeckTab`', () => {
      const { isDeckEnabled } = useBaseFormDeckOptions(
        { ...konnectFormBase },
        SupportedEntityType.Plugin,
      )

      expect(isDeckEnabled.value).toBe(false)
    })

    it('is enabled for Konnect with `enableDeckTab: true`', () => {
      const { isDeckEnabled } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      )

      expect(isDeckEnabled.value).toBe(true)
    })

    it('is enabled for Konnect with an `enableDeckTab` object', () => {
      const options: DeckConfigOptions = {}
      const { isDeckEnabled } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: options },
        SupportedEntityType.Plugin,
      )

      expect(isDeckEnabled.value).toBe(true)
    })
  })

  describe('deckCustomizationOptions', () => {
    it('is undefined for Kong Manager', () => {
      const { deckCustomizationOptions } = useBaseFormDeckOptions(
        { ...kongManagerFormBase },
        SupportedEntityType.Plugin,
      )

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('is undefined when `enableDeckTab` is a boolean', () => {
      const { deckCustomizationOptions } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      )

      expect(deckCustomizationOptions.value).toBeUndefined()
    })

    it('returns the nested `customization` field', () => {
      const customization = { generateKonnectPat: async () => 'pat' }
      const { deckCustomizationOptions } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: { customization } },
        SupportedEntityType.Plugin,
      )

      expect(deckCustomizationOptions.value).toBe(customization)
    })
  })

  describe('deckCalloutPreferenceKey', () => {
    it('returns `deckCalloutPreferenceKey` for Kong Manager configs', () => {
      const { deckCalloutPreferenceKey } = useBaseFormDeckOptions(
        { ...kongManagerFormBase, deckCalloutPreferenceKey: 'km-key' },
        SupportedEntityType.Plugin,
      )

      expect(deckCalloutPreferenceKey.value).toBe('km-key')
    })

    it('returns the nested `calloutPreferenceKey` for Konnect configs', () => {
      const { deckCalloutPreferenceKey } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: { calloutPreferenceKey: 'konnect-key' } },
        SupportedEntityType.Plugin,
      )

      expect(deckCalloutPreferenceKey.value).toBe('konnect-key')
    })

    it('is undefined when Konnect `enableDeckTab` is a boolean', () => {
      const { deckCalloutPreferenceKey } = useBaseFormDeckOptions(
        { ...konnectFormBase, enableDeckTab: true },
        SupportedEntityType.Plugin,
      )

      expect(deckCalloutPreferenceKey.value).toBeUndefined()
    })
  })
})
