import { computed, inject, toValue } from 'vue'

import { DECK_COMMAND_EDITOR_KEY, DECK_COMMAND_EDITOR_MISSING_WARNING } from '../constants'
import { isSupportedDeckEntityType } from '../types'

import type { MaybeRefOrGetter } from 'vue'
import type { ConfigCardDisplayConfig } from '../utils/config-card'

import type {
  KongManagerBaseFormConfig,
  KonnectBaseFormConfig,
  SupportedEntityType,
} from '../types'

export function useBaseEntityDeckOptions(
  config: MaybeRefOrGetter<ConfigCardDisplayConfig>,
  entityType: MaybeRefOrGetter<SupportedEntityType | undefined>,
) {
  const deckCommandEditor = inject(DECK_COMMAND_EDITOR_KEY, null)

  const isDeckEnabled = computed(() => {
    const c = toValue(config)
    const enabled = c.app === 'kongManager' || Boolean(c.app === 'konnect' && c.enableDeckConfig)
    const type = toValue(entityType)
    return enabled && type !== undefined && isSupportedDeckEntityType(type)
  })

  const deckCustomizationOptions = computed(() => {
    const c = toValue(config)
    const configured = c.app === 'konnect' && c.enableDeckConfig && typeof c.enableDeckConfig !== 'boolean'
      ? c.enableDeckConfig.customization
      : undefined
    if (configured && !deckCommandEditor) {
      console.warn(DECK_COMMAND_EDITOR_MISSING_WARNING)
      return undefined
    }
    return configured
  })

  const deckCalloutPreferenceKey = computed(() => {
    const c = toValue(config)
    return c.app === 'konnect' && c.enableDeckConfig && typeof c.enableDeckConfig !== 'boolean'
      ? c.enableDeckConfig.calloutPreferenceKey
      : c.app === 'kongManager'
        ? c.deckCalloutPreferenceKey
        : undefined
  })

  return {
    isDeckEnabled,
    deckCustomizationOptions,
    deckCalloutPreferenceKey,
  }
}

export function useBaseFormDeckOptions(
  config: MaybeRefOrGetter<KonnectBaseFormConfig | KongManagerBaseFormConfig>,
  entityType: MaybeRefOrGetter<SupportedEntityType>,
) {
  const deckCommandEditor = inject(DECK_COMMAND_EDITOR_KEY, null)

  const isDeckEnabled = computed(() => {
    const c = toValue(config)
    const enabled = c.app === 'kongManager' || Boolean(c.app === 'konnect' && c.enableDeckTab)
    return enabled && isSupportedDeckEntityType(toValue(entityType))
  })

  const deckCustomizationOptions = computed(() => {
    const c = toValue(config)
    const configured = c.app === 'konnect' && c.enableDeckTab && typeof c.enableDeckTab !== 'boolean'
      ? c.enableDeckTab.customization
      : undefined
    if (configured && !deckCommandEditor) {
      console.warn(DECK_COMMAND_EDITOR_MISSING_WARNING)
      return undefined
    }
    return configured
  })

  const deckCalloutPreferenceKey = computed(() => {
    const c = toValue(config)
    return c.app === 'konnect' && c.enableDeckTab && typeof c.enableDeckTab !== 'boolean'
      ? c.enableDeckTab.calloutPreferenceKey
      : c.app === 'kongManager'
        ? c.deckCalloutPreferenceKey
        : undefined
  })

  return {
    isDeckEnabled,
    deckCustomizationOptions,
    deckCalloutPreferenceKey,
  }
}
