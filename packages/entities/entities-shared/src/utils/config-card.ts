import type { DeckConfigOptions, EntityConfigCardViewConfig, KongManagerBaseEntityConfig, KonnectBaseEntityConfig } from '../types'

/** Configs accepted by `ConfigCardDisplay` and `useBaseEntityDeckOptions`: reader configs and the View's display config. */
export type ConfigCardDisplayConfig = KongManagerBaseEntityConfig | KonnectBaseEntityConfig | (Omit<EntityConfigCardViewConfig, 'enableDeckConfig'> & {
  deckCalloutPreferenceKey?: string
  enableDeckConfig?: boolean | DeckConfigOptions
})

/** Pass only export metadata to the View. The reader supplies its decK options separately. */
export function getConfigCardViewConfig(config: KongManagerBaseEntityConfig | KonnectBaseEntityConfig): EntityConfigCardViewConfig {
  return {
    app: config.app,
    controlPlaneName: 'controlPlaneName' in config ? config.controlPlaneName : undefined,
    geoApiServerUrl: 'geoApiServerUrl' in config ? config.geoApiServerUrl : undefined,
    apiBaseUrl: config.apiBaseUrl,
    workspace: config.workspace,
  }
}
