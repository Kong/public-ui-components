import { computed, toValue } from 'vue'

import { isSupportedDeckEntityType } from '../types'

import type { MaybeRefOrGetter } from 'vue'

import type {
  KongManagerBaseEntityConfig,
  KongManagerBaseFormConfig,
  KonnectBaseEntityConfig,
  KonnectBaseFormConfig,
  SupportedEntityType,
} from '../types'

export function useBaseEntityDeckOptions(
  config: MaybeRefOrGetter<KonnectBaseEntityConfig | KongManagerBaseEntityConfig>,
  entityType: MaybeRefOrGetter<SupportedEntityType>,
) {
  const isDeckEnabled = computed(() => {
    const c = toValue(config)
    const enabled = c.app === 'kongManager' || Boolean(c.app === 'konnect' && c.enableDeckConfig)
    return enabled && isSupportedDeckEntityType(toValue(entityType))
  })

  const deckCustomizationOptions = computed(() => {
    const c = toValue(config)
    return c.app === 'konnect' && c.enableDeckConfig && typeof c.enableDeckConfig !== 'boolean'
      ? c.enableDeckConfig.customization
      : undefined
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
  const isDeckEnabled = computed(() => {
    const c = toValue(config)
    const enabled = c.app === 'kongManager' || Boolean(c.app === 'konnect' && c.enableDeckTab)
    return enabled && isSupportedDeckEntityType(toValue(entityType))
  })

  const deckCustomizationOptions = computed(() => {
    const c = toValue(config)
    return c.app === 'konnect' && c.enableDeckTab && typeof c.enableDeckTab !== 'boolean'
      ? c.enableDeckTab.customization
      : undefined
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
