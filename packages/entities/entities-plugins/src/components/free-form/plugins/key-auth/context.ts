export interface KeyAuthContext {
  /**
   * Enables the Kong Identity "centrally managed consumers" flow: the `identity_realms`
   * field, its realms fetch, and the "Centrally managed consumers" mode option.
   * Defaults to `true` when no context is provided.
   */
  identityRealmsEnabled?: boolean

  /**
   * Enables the `realm` field. When disabled, the field is hidden regardless of whether
   * it's required in the schema. Defaults to `true` when no context is provided.
   */
  realmsEnabled?: boolean

  /**
   * Enables the `anonymous` field. When disabled, the field is hidden regardless of the
   * schema, and any schema-computed default is stripped so it can't be silently submitted.
   * Defaults to `true` when no context is provided.
   */
  anonymousEnabled?: boolean
}
