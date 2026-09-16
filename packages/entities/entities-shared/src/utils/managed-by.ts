import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

/**
 * Ownership metadata Konnect attaches to control plane entities that were created
 * by something other than a human in the UI (Terraform, decK, the operator, ...).
 */
export type ManagedBy = Record<string, string> | null

/** Owners report themselves under `tool` (external) or `service` (Konnect). */
export const getManagedByOwner = (managedBy?: ManagedBy): string | null =>
  managedBy?.service || managedBy?.tool || null

/** Shown for a known owner that we have no friendly name for. */
export const CUSTOM_OWNER_LABEL = 'Custom'

export const MANAGED_BY_LABELS: Record<string, string> = {
  'terraform-provider-konnect': 'Terraform',
  'deck': 'decK',
  'kong-gateway-operator': 'Kong Gateway Operator',
  'gw-manager': 'Konnect UI',
  'ai-manager': 'AI Manager',
  'dev-portal': 'Dev Portal',
}

/**
 * Resolve `managed_by` to a display label.
 * Returns `null` when there is no owner, so callers can render their own empty state
 * rather than a misleading label.
 */
export const getManagedByLabel = (managedBy?: ManagedBy): string | null => {
  const owner = getManagedByOwner(managedBy)
  return owner ? (MANAGED_BY_LABELS[owner] ?? CUSTOM_OWNER_LABEL) : null
}

let managedByFieldLabel: string | undefined

/**
 * The "Managed By" heading, shared by the detail cards and the list column so the two
 * surfaces cannot drift apart. Entity packages use this instead of a per-package key.
 *
 * Memoized because callers read it from inside computeds, and `createI18n` re-flattens the
 * whole message catalogue on every call.
 */
export const getManagedByFieldLabel = (): string => {
  if (managedByFieldLabel === undefined) {
    managedByFieldLabel = createI18n<typeof english>('en-us', english)
      .t('baseConfigCard.commonFields.managed_by_label')
  }
  return managedByFieldLabel
}
