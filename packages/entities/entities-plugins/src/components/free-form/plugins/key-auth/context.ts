export interface KeyAuthContext {
  /**
   * Enables the Kong Identity "centrally managed consumers" flow: the `identity_realms`
   * field, its realms fetch, and the "Centrally managed consumers" mode option.
   * Defaults to `true` when no context is provided.
   */
  identityRealmsEnabled?: boolean
}
