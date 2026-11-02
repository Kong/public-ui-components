import type { DeckConfigOptions, EntityConfigCardViewConfig } from '../types'

export type ConfigCardDisplayConfig = Omit<EntityConfigCardViewConfig, 'enableDeckConfig'> & {
  enableDeckConfig?: boolean | DeckConfigOptions
}

/** Project presentation context without carrying request capabilities into a View. */
export function getConfigCardViewConfig(config: ConfigCardDisplayConfig): EntityConfigCardViewConfig {
  const deck = config.enableDeckConfig
  return {
    app: config.app,
    formatPreferenceKey: config.formatPreferenceKey,
    deckCalloutPreferenceKey: config.deckCalloutPreferenceKey,
    controlPlaneName: config.controlPlaneName,
    geoApiServerUrl: config.geoApiServerUrl,
    apiBaseUrl: config.apiBaseUrl,
    workspace: config.workspace,
    enableDeckConfig: typeof deck === 'object' ? {
      calloutPreferenceKey: deck.calloutPreferenceKey,
      customization: Boolean(deck.customization),
    } : deck,
  }
}
