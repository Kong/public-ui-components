export interface KeyAuthContext {
  /**
   * Identifies the host product embedding this form. When `'ai-manager'`,
   * Kong Identity principals are the primary identity mode: the Kong Identity
   * card is listed first and selected by default (on create and edit).
   */
  source?: 'ai-manager'
}
