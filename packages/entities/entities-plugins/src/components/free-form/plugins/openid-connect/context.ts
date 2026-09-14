export interface OpenidConnectContext {
  /**
   * Identifies the host product embedding this form. When `'ai-manager'`,
   * `cache_tokens_salt` becomes a required field and, in create mode, is
   * prefilled with a random 32-character value.
   */
  source?: 'ai-manager'

  /**
   * Enables the `anonymous` field. When disabled, the field is hidden regardless of the
   * schema, and any schema-computed default is stripped so it can't be silently submitted.
   * Defaults to `true` when no context is provided.
   */
  anonymousEnabled?: boolean
}
