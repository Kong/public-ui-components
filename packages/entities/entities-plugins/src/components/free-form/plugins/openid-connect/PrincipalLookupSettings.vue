<template>
  <KCollapse
    class="principals-advanced-settings"
    data-testid="principals-advanced-settings"
    :trigger-label="t('plugins.free-form.openid-connect.lookup.collapse_label')"
  >
    <!-- Principal-lookup-specific content requires the `principals` schema fields; sibling
         advanced settings (e.g. OIDC auth methods, in the default slot below) are unrelated
         and always render regardless. -->
    <template v-if="showPrincipalsFields">
      <slot name="banner" />
      <KAlert
        v-if="dataPlaneIncompatible"
        appearance="warning"
        class="principals-dp-version-alert"
        data-testid="oidc-principals-dp-version-alert"
        :message="t('plugins.free-form.openid-connect.principals.dp_version_alert')"
        show-icon
      />
      <div class="principals-field-group">
        <KInputSwitch
          data-testid="use-principal-lookup"
          :disabled="disabled"
          :model-value="lookupEnabled"
          @update:model-value="handleEnableToggle"
        >
          <template #label>
            <KLabel
              :info="t('plugins.free-form.openid-connect.lookup.toggle_info')"
              :tooltip-attributes="{ maxWidth: '300' }"
            >
              {{ t('plugins.free-form.openid-connect.lookup.toggle_label') }}
            </KLabel>
          </template>
        </KInputSwitch>
      </div>
      <div class="principals-field-group">
        <KSelect
          class="principals-lookup-method-select"
          data-testid="principals-lookup-method"
          :disabled="fieldsDisabled"
          :help="t('plugins.free-form.openid-connect.lookup.method.help')"
          :items="lookupMethodItems"
          :label="t('plugins.free-form.openid-connect.lookup.method.label')"
          :model-value="selectedLookupMethod"
          :placeholder="t('plugins.free-form.openid-connect.lookup.method.placeholder')"
          @update:model-value="handleLookupMethodChange"
        >
          <template #item-template="{ item }">
            <div class="lookup-method-item">
              <div class="lookup-method-item-label">
                {{ item.label }}
              </div>
              <div class="lookup-method-item-description">
                {{ (item as any).description }}
              </div>
            </div>
          </template>
        </KSelect>

        <KInput
          v-if="selectedLookupMethod === 'custom-identity'"
          class="principals-custom-identity-name-input"
          data-testid="principals-custom-identity-name"
          :disabled="fieldsDisabled"
          :help="t('plugins.free-form.openid-connect.lookup.custom_identity_name.help')"
          :label="t('plugins.free-form.openid-connect.lookup.custom_identity_name.label')"
          :model-value="principalBy ?? undefined"
          :placeholder="t('plugins.free-form.openid-connect.lookup.custom_identity_name.placeholder')"
          @update:model-value="principalBy = $event"
        />

        <KInput
          class="principals-token-claim-input"
          data-testid="principals-token-claim"
          :disabled="fieldsDisabled"
          :help="tokenClaimHelp"
          :label="t('plugins.free-form.openid-connect.lookup.token_claim.label')"
          :model-value="tokenClaimInput"
          :placeholder="t('plugins.free-form.openid-connect.lookup.token_claim.placeholder')"
          @update:model-value="handleTokenClaimChange"
        />
      </div>
      <div class="principals-field-group">
        <KLabel>{{ t('plugins.free-form.openid-connect.lookup.error_on_miss.label') }}</KLabel>
        <KRadio
          data-testid="principals-error-on-miss-true"
          :description="t('plugins.free-form.openid-connect.lookup.error_on_miss.reject_description')"
          :disabled="fieldsDisabled"
          :label="t('plugins.free-form.openid-connect.lookup.error_on_miss.reject_label')"
          :model-value="errorOnMiss ?? null"
          :selected-value="true"
          @change="errorOnMiss = true"
        />
        <KRadio
          data-testid="principals-error-on-miss-false"
          :description="t('plugins.free-form.openid-connect.lookup.error_on_miss.continue_description')"
          :disabled="fieldsDisabled"
          :label="t('plugins.free-form.openid-connect.lookup.error_on_miss.continue_label')"
          :model-value="errorOnMiss ?? null"
          :selected-value="false"
          @change="errorOnMiss = false"
        />
      </div>

      <div class="principals-field-group">
        <KCheckbox
          data-testid="principals-match-consumer"
          :disabled="fieldsDisabled"
          :model-value="matchConsumer ?? false"
          @update:model-value="matchConsumer = $event"
        >
          {{ t('plugins.free-form.openid-connect.lookup.match_consumer.label') }}
          <template #description>
            {{ t('plugins.free-form.openid-connect.lookup.match_consumer.description') }}
            <KExternalLink
              class="principals-learn-more-link"
              hide-icon
              href="https://developer.konghq.com/identity/principals/"
              rel="noopener noreferrer"
              target="_blank"
            >
              {{ t('plugins.free-form.openid-connect.lookup.match_consumer.link') }}
            </KExternalLink>
          </template>
        </KCheckbox>
      </div>

      <div class="principals-field-group">
        <KCheckbox
          data-testid="principals-match-consumer-groups"
          :disabled="fieldsDisabled"
          :model-value="matchConsumerGroups ?? false"
          @update:model-value="matchConsumerGroups = $event"
        >
          {{ t('plugins.free-form.openid-connect.lookup.match_consumer_groups.label') }}
          <template #description>
            {{ t('plugins.free-form.openid-connect.lookup.match_consumer_groups.description') }}
            <KExternalLink
              class="principals-learn-more-link"
              hide-icon
              href="https://developer.konghq.com/identity/principals/"
              rel="noopener noreferrer"
              target="_blank"
            >
              {{ t('plugins.free-form.openid-connect.lookup.match_consumer_groups.link') }}
            </KExternalLink>
          </template>
        </KCheckbox>
      </div>
    </template>

    <!-- Host slot for sibling advanced settings (the OIDC auth methods + session
         management), rendered at the bottom so the form shows a single "additional
         settings" section instead of multiple collapses. Always rendered — unrelated
         to principals fields. -->
    <slot />
  </KCollapse>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { isEqual } from 'lodash-es'
import { KAlert, KCheckbox, KCollapse, KInput, KInputSwitch, KLabel, KRadio, KSelect } from '@kong/kongponents'
import useI18n from '../../../../composables/useI18n'
import { useFormShared } from '../../shared/composables'
import { FORM_EDITING } from '../../shared/const'

import type { ComputedRef } from 'vue'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { EmptyValue } from '../../shared/types'
import type { OidcConfigSubset, OidcPrincipals } from './types'

const { showPrincipalsFields = true, ...props } = defineProps<{
  /** Whether the fields are gated (loading, or no principals exist in the directory yet). */
  disabled?: boolean
  /** Whether a connected data plane node can't process Kong Identity principals (Gateway 3.15+ required). */
  dataPlaneIncompatible?: boolean
  /**
   * Whether the principal-lookup-specific content (banner, toggle, lookup method,
   * error-on-miss, linked consumer settings) renders at all.
   */
  showPrincipalsFields?: boolean
  /** Called when the opt-in toggle changes; the parent owns flipping principals.enabled. */
  onEnabledChange?: (enabled: boolean) => void
}>()

const { i18n: { t } } = useI18n()

const isEditingRef = inject<ComputedRef<boolean> | undefined>(FORM_EDITING, undefined)

// Read/write formData directly instead of useFormData(): the latter provides its own
// field path to descendants, which would corrupt relative path resolution for the
// sibling advanced settings rendered in the default slot (e.g. OIDC auth methods).
const { formData, getEmptyValue } = useFormShared<FreeFormPluginData<OidcConfigSubset>>()

function usePrincipalsField<K extends keyof OidcPrincipals>(key: K) {
  return computed<OidcPrincipals[K] | undefined>({
    get: () => formData.config?.principals?.[key],
    set: (value) => {
      if (formData.config?.principals) {
        formData.config.principals[key] = value as OidcPrincipals[K]
      }
    },
  })
}

const lookupEnabledValue = usePrincipalsField('enabled')
const principalBy = usePrincipalsField('principal_by')
const principalClaim = usePrincipalsField('principal_claim')
const errorOnMiss = usePrincipalsField('error_on_miss')
const matchConsumer = usePrincipalsField('match_consumer')
const matchConsumerGroups = usePrincipalsField('match_consumer_groups')

const lookupMethodItems = [
  {
    label: t('plugins.free-form.openid-connect.lookup.method.kong_identity_label'),
    value: 'kong-identity',
    description: t('plugins.free-form.openid-connect.lookup.method.kong_identity_description'),
  },
  {
    label: t('plugins.free-form.openid-connect.lookup.method.custom_identity_label'),
    value: 'custom-identity',
    description: t('plugins.free-form.openid-connect.lookup.method.custom_identity_description'),
  },
]

const hasValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

// principal_by is the true discriminator: it's only set for a custom-identity
// (type=custom) lookup. A principal_claim on its own is just an OIDC lookup
// against a non-`sub` claim, which is still the kong-identity method.
const selectedLookupMethod = ref<string>(hasValue(principalBy.value) ? 'custom-identity' : 'kong-identity')

const lookupEnabled = computed(() => lookupEnabledValue.value === true)

// Fields are inert when lookup is off.
const fieldsDisabled = computed(() => props.disabled || !lookupEnabled.value)

// principal_claim is the value source in both modes (default `sub`), but in
// custom-identity mode that value is matched against the Custom identity name,
// so call out the pairing there.
const tokenClaimHelp = computed(() =>
  selectedLookupMethod.value === 'custom-identity'
    ? t('plugins.free-form.openid-connect.lookup.token_claim.help_custom')
    : t('plugins.free-form.openid-connect.lookup.token_claim.help'),
)

function encodeTokenClaim(claim: string[] | string | null | undefined): string {
  if (Array.isArray(claim) && claim.length > 0) {
    // Escape literal backslashes and dots within each part before joining
    return claim.map(part => part.replace(/[\\.]/g, m => `\\${m}`)).join('.')
  }
  if (typeof claim === 'string' && claim) {
    return claim
  }
  return ''
}

// Split on unescaped dots; `\.` and `\\` are escapes for literal dots/backslashes,
// any other backslash is kept as-is.
function parseTokenClaim(value: string): string[] | EmptyValue {
  if (!value) return getEmptyValue()
  const parts: string[] = []
  let current = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && (value[i + 1] === '.' || value[i + 1] === '\\')) {
      current += value[i + 1]
      i++
    } else if (ch === '.') {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  const result = parts.map(part => part.trim()).filter(Boolean)
  // Unset rather than `[]`: the schema requires len_min 1 when the claim is present,
  // and an absent principal_claim already resolves to the gateway default (`sub`).
  return result.length > 0 ? result : getEmptyValue()
}

// One-time prefill on create: if principal_claim has never been set, write the gateway
// default `sub` into the model so users see it explicitly rather than an implicit default
// (and the shown value is the submitted one). Only fires once, on setup — later clears stay
// cleared. Skipped on edit: an absent claim on a saved record already resolves to `sub`, so
// writing it would dirty the form on load for no change in behavior.
if (!isEditingRef?.value && !hasValue(principalClaim.value)) {
  principalClaim.value = ['sub']
}

// The input binds to the raw string and the model derives from it one-way: re-encoding
// the display on every keystroke would corrupt in-progress escape sequences (a dangling
// `\` would round-trip into `\\`).
const tokenClaimInput = ref(encodeTokenClaim(principalClaim.value))

function handleTokenClaimChange(rawValue: string) {
  tokenClaimInput.value = rawValue
  principalClaim.value = parseTokenClaim(rawValue.trim())
}

// Re-sync the display only when the model changes from elsewhere (e.g. switching the
// lookup method clears the claim), never while it reflects the user's own typing.
// Both sides are normalized through `?? null` before comparing: `emptyFieldValue:
// 'undefined'` can make either side `undefined` while the other is `null`, and without
// this the mismatch would resync the display and clobber in-progress typing.
watch(principalClaim, (claim) => {
  const parsedInput = parseTokenClaim(tokenClaimInput.value.trim())
  if (!isEqual(claim ?? null, parsedInput ?? null)) {
    tokenClaimInput.value = encodeTokenClaim(claim)
  }
})

function handleLookupMethodChange(value: string | null) {
  selectedLookupMethod.value = value ?? 'kong-identity'
  if (value !== 'custom-identity') {
    principalBy.value = getEmptyValue()
    principalClaim.value = getEmptyValue()
  }
}

function handleEnableToggle(enabled: boolean) {
  if (props.onEnabledChange) {
    props.onEnabledChange(enabled)
  } else {
    lookupEnabledValue.value = enabled
  }
}
</script>

<style lang="scss" scoped>
.principals-advanced-settings {
  margin-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-hidden-content) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
  }

  .principals-lookup-method-select :deep(.k-label) {
    margin-top: 0;
  }
}

.principals-field-group {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  .principals-token-claim-input,
  .principals-custom-identity-name-input {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .principals-learn-more-link {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    gap: var(--kui-space-20, $kui-space-20);

    &:hover {
      color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
    }

    &:focus-visible {
      color: var(--kui-color-text-primary-stronger, $kui-color-text-primary-stronger);
    }

    &:active {
      color: var(--kui-color-text-primary-strongest, $kui-color-text-primary-strongest);
    }
  }
}

.lookup-method-item {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);
}

.lookup-method-item-label {
  color: var(--kui-color-text, $kui-color-text);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.lookup-method-item-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
}
</style>
