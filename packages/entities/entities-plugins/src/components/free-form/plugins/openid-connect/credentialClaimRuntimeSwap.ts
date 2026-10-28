import { isVersionSupported } from '@kong-ui-public/freeform'
import type { FormSchema } from '@kong-ui-public/freeform'

/**
 * AI Gateway 2.3 is the first runtime that understands `credential_claims`;
 * older runtimes only know the deprecated `credential_claim` (still a regular
 * field in their schemas) and reject the unknown plural on save.
 */
export const CREDENTIAL_CLAIMS_MIN_AIGW_VERSION = '2.3'

/**
 * Whether the given AIGW min runtime version must be served the deprecated
 * `credential_claim`. Fails open (no swap) when no version is pinned — API
 * Gateway hosts never set one.
 */
export const isLegacyCredentialClaimRuntime = (minRuntimeVersion: string | undefined): boolean =>
  !!minRuntimeVersion
  && !isVersionSupported(minRuntimeVersion, CREDENTIAL_CLAIMS_MIN_AIGW_VERSION)

/**
 * The runtime swap on a plugin schema's `config` record: `credential_claims`
 * drops out of `fields[]` (so it neither renders nor ships in the payload) and
 * the deprecated `credential_claim` is lifted from `shorthand_fields` back into
 * `fields[]` — with its pre-deprecation default when the schema records one
 * (`deprecation.old_default`). A schema that already has `credential_claim` as
 * a regular field (stale shape) only loses `credential_claims`.
 *
 * Shared by `OpenidConnectForm` (render) and `PluginEntityForm`
 * (`stripUnknownConfigFields`) so the walker whitelists exactly the field the
 * form renders — otherwise the lifted `credential_claim` is dropped as
 * "unknown" and the user's claim silently vanishes from the payload.
 */
export function swapConfigRecordForLegacyRuntime(
  config: Record<string, any> | undefined,
  legacy: boolean,
): Record<string, any> | undefined {
  if (!legacy || !config) return config

  const swapped = { ...config } as {
    fields?: Array<Record<string, any>>
    shorthand_fields?: Array<Record<string, any>>
  }
  if (!Array.isArray(swapped.fields)) return config

  swapped.fields = swapped.fields.filter(f => !('credential_claims' in f))
  if (!swapped.fields.some(f => 'credential_claim' in f)) {
    const shorthandDef = swapped.shorthand_fields?.find(f => 'credential_claim' in f)?.credential_claim
    if (shorthandDef) {
      const { deprecation, ...fieldDef } = shorthandDef
      swapped.fields = [...swapped.fields, {
        credential_claim: { ...fieldDef, required: false, default: deprecation?.old_default },
      }]
    }
  }

  return swapped
}

/**
 * {@link swapConfigRecordForLegacyRuntime} applied to the `config` field of a
 * full plugin schema.
 */
export function swapCredentialClaimForLegacyRuntime(schema: FormSchema, legacy: boolean): FormSchema {
  if (!legacy) return schema

  const fields = [...schema.fields]
  const configIndex = fields.findIndex(f => 'config' in f)
  if (configIndex === -1) return schema

  const configField = { ...fields[configIndex] } as Record<string, any>
  configField.config = swapConfigRecordForLegacyRuntime(configField.config, legacy)
  fields[configIndex] = configField
  return { ...schema, fields }
}
