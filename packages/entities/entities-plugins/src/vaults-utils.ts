/**
 * Example: {vault://my-vault/secret-id/tokens/refresh_token}
 */
export interface ParsedSecretRef {
  /**
   * Vault prefix (non-empty string)
   *
   * Example: my-vault
   */
  vaultPrefix: string

  /**
   * Secret ID (non-empty string or undefined)
   *
   * A secret reference without a secret ID is invalid, but we should allow
   * references in this format being parsed and built.
   *
   * Example: secret-id
   */
  secretId?: string

  /**
   * Secret key (non-empty string or undefined)
   *
   * Example: tokens/refresh_token
   */
  optionalSecretKey?: string
}

/**
 * Parses a secret reference like {vault://vault-name/secret-id[/secret-key]}
 *
 * THIS FUNC MAY THROW ERRORS. USE IN TRY/CATCH BLOCK
 *
 * @param secretRef the secret reference to parse
 * @returns
 */
export const parseSecretRef = (secretRef: string): ParsedSecretRef => {
  let r = secretRef.trim()
  if (!r.startsWith('{') || !r.endsWith('}')) {
    throw new Error('Invalid secret reference: must be enclosed in curly braces')
  }

  r = r.substring(1, r.length - 1).trim()
  if (!r.startsWith('vault://')) {
    throw new Error('Invalid secret reference: must start with vault://')
  }

  // Workaround to parse the reference as a URL
  const parsed = new URL(`http://${r.substring(8)}`)
  if (!parsed) {
    throw new Error('Invalid secret reference: must have a vault prefix')
  }

  const parsedVaultPrefix = parsed.host // Everything before the first slash
  const [, parsedSecretId, ...parsedOptionalSecretKey] = parsed.pathname.split('/')
  if (!parsedVaultPrefix) {
    throw new Error('Invalid secret reference: must have a vault prefix')
  }

  return {
    vaultPrefix: parsedVaultPrefix,
    secretId: parsedSecretId || undefined, // Non-empty string or undefined
    optionalSecretKey: parsedOptionalSecretKey?.join('/'), // Non-empty string or undefined
  }
}

export const buildSecretRef = (parsedSecretRef: ParsedSecretRef): string => {
  if (!parsedSecretRef.vaultPrefix) {
    throw new Error('Invalid secret reference: must have a vault prefix')
  }
  let ref = `vault://${parsedSecretRef.vaultPrefix}`
  if (parsedSecretRef.secretId) {
    ref = `${ref}/${parsedSecretRef.secretId}`
  }
  if (parsedSecretRef.optionalSecretKey) {
    ref = `${ref}/${parsedSecretRef.optionalSecretKey}`
  }
  return `{${ref}}`
}
