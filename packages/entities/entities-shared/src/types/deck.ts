import type { SupportedEntityDeck } from './entity-base-config-card'

export interface DeckCodeBlockProps {
  app: 'konnect' | 'kongManager'
  /** A record to indicate the entity's configuration, used to populate the decK code block */
  entityRecord: Record<string, any>
  entityType: SupportedEntityDeck
  /** e.g. https://us.api.konghq.tech, used to pass --konnect-addr parameter to decK */
  geoApiServerUrl?: string
  controlPlaneName?: string
  /** e.g. https://localhost:8001, used to pass --kong-addr parameter to decK */
  kongAdminApiUrl?: string
  workspace?: string
}

export interface DeckCustomizationOptions {
  /**
   * A function to generate a Konnect Personal Access Token (PAT).
   * This enables the user to generate a PAT directly from the UI.
   */
  generateKonnectPat?: (name: string, expiresAt: Date) => string | Promise<string>
}

export interface DeckConfigOptions {
  /**
   * This option enables the "Customize before copying" feature on the decK config.
   *
   * Requires the host app to provide `DeckCommandEditor` via the
   * `DECK_COMMAND_EDITOR_KEY` injection key — typically through the
   * `provideDeckCommandEditor` helper from `@kong-ui-public/entities-shared/deck-editor`.
   * If the editor is not provided, the customize button is hidden and a
   * `console.warn` is emitted at runtime.
   *
   * See {@link DeckCustomizationOptions} for extra options.
   */
  customization?: boolean | DeckCustomizationOptions
  /**
   * The localStorage key to use while persisting the visibility preference for the
   * decK format callout. Omitting this will hide the callout in any case.
   */
  calloutPreferenceKey?: string
}

export type DeckCalloutPreference = 'visible' | 'dismissed'
