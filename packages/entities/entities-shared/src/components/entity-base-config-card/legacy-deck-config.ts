import type { InjectionKey, Ref } from 'vue'
import type { DeckConfigOptions } from '../../types'

// Only the legacy reader owns the existing optional PAT-generation capability.
export const LEGACY_CONFIG_CARD_DECK_OPTIONS: InjectionKey<Readonly<Ref<boolean | DeckConfigOptions | undefined>>> = Symbol('legacy-config-card-deck-options')
