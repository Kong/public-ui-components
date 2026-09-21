/**
 * Plugin types that gate real traffic on a per-consumer credential/grant and are shown
 * a "next steps" onboarding banner on their detail page. `acl` is included even though
 * it's authorization rather than authentication - it has the same dead-end (nothing is
 * allowed/denied until a consumer is added to a group). Excludes non-credentialed
 * `PluginGroup.AUTHENTICATION` plugins (openid-connect, ldap-auth, mtls-auth, jwt-signer,
 * etc.) which don't create a consumer credential the same way.
 */
export const AUTH_ONBOARDING_PLUGIN_TYPES = ['basic-auth', 'key-auth', 'key-auth-enc', 'oauth2', 'hmac-auth', 'jwt', 'acl'] as const

export type AuthOnboardingPluginType = typeof AUTH_ONBOARDING_PLUGIN_TYPES[number]

/**
 * Identifies which consumer credential type a credential form renders. By Kong convention this
 * is the same string as the plugin that gates on it (e.g. the `key-auth` plugin produces
 * `key-auth` credentials) - `CREDENTIAL_METADATA` is keyed by this identifier - but the form
 * itself configures a consumer's credential, not the plugin, so credential-facing props use this
 * alias rather than `AuthOnboardingPluginType` directly.
 */
export type CredentialType = AuthOnboardingPluginType

export interface CreatedConsumer {
  id: string
  username?: string
  custom_id?: string
}
