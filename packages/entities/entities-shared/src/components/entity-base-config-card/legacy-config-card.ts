import type { InjectionKey, Ref } from 'vue'
import type { ConfigCardCodeFormat, DeckConfigOptions } from '../../types'

// Request metadata and legacy resolver/PAT behavior belong to readers, never View inputs.
interface LegacyConfigCardContext {
  requestUrl: string
  formatsToHide: ConfigCardCodeFormat[]
  deckOptions?: boolean | DeckConfigOptions
  redactedCodeBlockRecord?: Record<string, any>
}

export const LEGACY_CONFIG_CARD_CONTEXT: InjectionKey<Readonly<Ref<LegacyConfigCardContext>>> = Symbol('legacy-config-card-context')
