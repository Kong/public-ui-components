export interface OpenidConnectContext {
  /**
   * Identifies the host product embedding this form. When `'ai-manager'`,
   * `cache_tokens_salt` becomes a required field and, in create mode, is
   * prefilled with a random 32-character value.
   */
  source?: 'ai-manager'
}
