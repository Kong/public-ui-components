import type { DeckConfigOptions, EntityConfigCardViewConfig, KongManagerBaseEntityConfig, KonnectBaseEntityConfig } from '../types'

export type ConfigCardDisplayConfig = KongManagerBaseEntityConfig | KonnectBaseEntityConfig | (Omit<EntityConfigCardViewConfig, 'enableDeckConfig'> & {
  deckCalloutPreferenceKey?: string
  enableDeckConfig?: boolean | DeckConfigOptions
})

/** Project presentation context without carrying request capabilities into a View. */
export function getConfigCardViewConfig(config: ConfigCardDisplayConfig): EntityConfigCardViewConfig {
  const deck = 'enableDeckConfig' in config ? config.enableDeckConfig : undefined
  return {
    app: config.app,
    controlPlaneName: 'controlPlaneName' in config ? config.controlPlaneName : undefined,
    geoApiServerUrl: 'geoApiServerUrl' in config ? config.geoApiServerUrl : undefined,
    apiBaseUrl: config.apiBaseUrl,
    workspace: config.workspace,
    enableDeckConfig: typeof deck === 'object' ? true : deck,
  }
}
