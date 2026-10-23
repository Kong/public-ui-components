export interface OpenidConnectContext {
  /**
   * Identifies the host product embedding this form. When `'ai-manager'`,
   * `cache_tokens_salt` becomes a required field and, in create mode, is
   * prefilled with a random 32-character value.
   */
  source?: 'ai-manager'
  /**
   * The AI Gateway minimum runtime version the host is targeting (AIGW min
   * runtime setting). Below 2.3 the form swaps the deprecated `credential_claim`
   * back in place of `credential_claims`. Absent → fail open to the plural-only
   * behavior. Hosts that pass it via the free-form `formConfig` instead need
   * not set it here.
   */
  minRuntimeVersion?: string
}
