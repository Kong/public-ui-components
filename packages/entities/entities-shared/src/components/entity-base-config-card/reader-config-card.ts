import type { InjectionKey, Ref } from 'vue'
import type { DeckConfigOptions } from '../../types'

/**
 * Behavior owned by `EntityBaseConfigCard`: request metadata, persistence, decK token
 * generation, resolver compatibility and the loading/error state. Never part of a View's props.
 */
export interface ReaderConfigCardContext {
  status: 'loading' | 'error' | 'ready'
  errorMessage: string
  requestUrl: string
  deckOptions?: boolean | DeckConfigOptions
  deckCalloutPreferenceKey?: string
  formatPreferenceKey?: string
  /** Code record redacted in the reader's legacy resolver order */
  redactedCodeBlockRecord?: Record<string, any>
  configCardDoc: string
  label: string
}

export const READER_CONFIG_CARD_CONTEXT: InjectionKey<Readonly<Ref<ReaderConfigCardContext>> | undefined> = Symbol('reader-config-card-context')
