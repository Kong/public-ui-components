<template>
  <KCollapse
    class="principals-advanced-settings"
    data-testid="principals-advanced-settings"
    trigger-label="Show additional settings"
  >
    <!-- Principal-lookup-specific content requires directories access; sibling advanced
         settings (e.g. OIDC auth methods, in the default slot below) are unrelated and
         always render regardless of this permission. -->
    <template v-if="showPrincipalsFields">
      <slot name="banner" />
      <KAlert
        v-if="dataPlaneIncompatible"
        appearance="warning"
        class="principals-dp-version-alert"
        data-testid="oidc-principals-dp-version-alert"
        message="We detected that one or more data plane nodes are running a version earlier than 3.15. If principal lookup is enabled, requests handled by those data plane nodes will fail."
        show-icon
      />
      <div
        v-if="showEnableToggle"
        class="principals-field-group"
      >
        <KInputSwitch
          data-testid="use-principal-lookup"
          :disabled="disabled"
          :model-value="lookupEnabled"
          @update:model-value="handleEnableToggle"
        >
          <template #label>
            <KLabel
              info="Look up the authenticated principal in Kong Identity after token validation. Enable this when the validated token doesn’t contain all of the identity data required for authorization or activity logging."
              :tooltip-attributes="{ maxWidth: '300' }"
            >
              Use principal lookup
            </KLabel>
          </template>
        </KInputSwitch>
      </div>
      <div class="principals-field-group">
        <KSelect
          class="principals-lookup-method-select"
          data-testid="principals-lookup-method"
          :disabled="fieldsDisabled"
          help="Principal lookup queries Kong Identity for the principal that matches the identity in a verified access token. This enables principal-aware policies and integrations. Requires all data plane nodes to be running version 3.15 or later."
          :items="lookupMethodItems"
          label="Principal lookup method"
          :model-value="selectedLookupMethod"
          placeholder="Select a lookup method"
          @update:model-value="handleLookupMethodChange"
        >
          <template #item-template="{ item }">
            <div class="lookup-method-item">
              <div class="lookup-method-item-label">
                {{ item.label }}
              </div>
              <div class="lookup-method-item-description">
                {{ item.description }}
              </div>
            </div>
          </template>
        </KSelect>

        <template v-if="selectedLookupMethod === 'custom-identity'">
          <KInput
            class="principals-custom-identity-name-input"
            data-testid="principals-custom-identity-name"
            :disabled="fieldsDisabled"
            help="Enter the custom identity name used to look up the principal. Kong matches the value from the token claim to a principal with the same custom identity name and value."
            label="Custom identity name"
            :model-value="formModel['config-principals-principal_by']"
            placeholder="e.g., Customer_ID"
            @update:model-value="updateField('config-principals-principal_by', $event)"
          />
        </template>

        <KInput
          class="principals-token-claim-input"
          data-testid="principals-token-claim"
          :disabled="fieldsDisabled"
          :help="tokenClaimHelp"
          label="Token claim"
          :model-value="getTokenClaimInputValue()"
          placeholder="e.g., user.employee_id"
          @update:model-value="handleTokenClaimChange($event)"
        />
      </div>
      <div class="principals-field-group">
        <KLabel>If principal lookup fails</KLabel>
        <KRadio
          data-testid="principals-error-on-miss-true"
          description="Treat the request as unauthenticated if Kong Identity cannot resolve the principal."
          :disabled="fieldsDisabled"
          label="Reject the request"
          :model-value="formModel['config-principals-error_on_miss']"
          :selected-value="true"
          @change="updateField('config-principals-error_on_miss', true)"
        />
        <KRadio
          data-testid="principals-error-on-miss-false"
          description="Allow the request to continue without resolving a principal."
          :disabled="fieldsDisabled"
          label="Continue without a principal"
          :model-value="formModel['config-principals-error_on_miss']"
          :selected-value="false"
          @change="updateField('config-principals-error_on_miss', false)"
        />
      </div>

      <div class="principals-field-group">
        <KCheckbox
          data-testid="principals-match-consumer"
          :disabled="fieldsDisabled"
          :model-value="formModel['config-principals-match_consumer']"
          @update:model-value="handleMatchConsumerChange($event)"
        >
          Use linked consumers
          <template #description>
            Use the consumer linked to the authenticated principal so existing consumer-based plugins and policies continue to work.
            <a
              href="https://developer.konghq.com/identity/principals/"
              rel="noopener noreferrer"
              target="_blank"
            >Learn how to link a consumer.</a>
          </template>
        </KCheckbox>
      </div>

      <div class="principals-field-group">
        <KCheckbox
          data-testid="principals-match-consumer-groups"
          :disabled="fieldsDisabled || !formModel['config-principals-match_consumer']"
          :model-value="formModel['config-principals-match_consumer_groups']"
          @update:model-value="updateField('config-principals-match_consumer_groups', $event)"
        >
          Use linked consumer groups
          <template #description>
            Use consumer groups linked to the authenticated principal so existing consumer group policies and plugins continue to work. Consumer groups can be linked through principal metadata.
            <a
              href="https://developer.konghq.com/identity/principals/"
              rel="noopener noreferrer"
              target="_blank"
            >Learn how to link a consumer group.</a>
          </template>
        </KCheckbox>
      </div>
    </template>

    <!-- Host slot for sibling advanced settings (e.g. OIDC auth methods) so the form
         shows a single "additional settings" section instead of multiple collapses.
         Always rendered — unrelated to principals/directories access. -->
    <slot />
  </KCollapse>
</template>

<script>
const lookupMethodItems = [
  {
    label: 'Kong Identity client',
    value: 'kong-identity',
    description: 'Match principals using a token claim, defaulting to the subject (sub) claim.',
  },
  {
    label: 'Custom claim',
    value: 'custom-identity',
    description: 'Match principals using a custom JWT claim.',
  },
]

const hasValue = value => {
  if (value === undefined || value === null || value === '') {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

const inferInitialLookupMethod = (formModel) => {
  // principal_by is the true discriminator: it's only set for a custom-identity
  // (type=custom) lookup. A principal_claim on its own is just an OIDC lookup
  // against a non-`sub` claim, which is still the kong-identity method.
  if (hasValue(formModel['config-principals-principal_by'])) {
    return 'custom-identity'
  }

  return 'kong-identity'
}

export default {
  name: 'PrincipalLookupSettings',
  props: {
    formModel: {
      type: Object,
      required: true,
    },
    onModelUpdated: {
      type: Function,
      required: true,
    },
    // Whether the fields are gated by the directory/principals check (loading, or no
    // principals exist in the directory yet).
    disabled: {
      type: Boolean,
      default: false,
    },
    // Whether to render the "Use principal lookup" opt-in toggle. Both Kong Identity and
    // External modes render it; lookup is off by default in either mode until enabled here.
    showEnableToggle: {
      type: Boolean,
      default: false,
    },
    // Called when the opt-in toggle changes; the parent owns flipping
    // config-principals-enabled and re-checking the directory.
    onEnabledChange: {
      type: Function,
      default: undefined,
    },
    // Whether a connected data plane node can't process Kong Identity principals
    // (Gateway 3.15+ required). Shown above the toggle once lookup is enabled.
    dataPlaneIncompatible: {
      type: Boolean,
      default: false,
    },
    // Whether the principal-lookup-specific content (banner, toggle, lookup method,
    // error-on-miss, linked consumer settings) renders at all — gated by directories
    // access at the call site. The default slot (e.g. OIDC auth methods) is unaffected.
    showPrincipalsFields: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      lookupMethodItems,
      selectedLookupMethod: inferInitialLookupMethod(this.formModel),
    }
  },
  computed: {
    lookupEnabled() {
      return this.formModel['config-principals-enabled'] === true
    },
    // Fields are inert when lookup is off, and otherwise follow the directory/principals gate.
    fieldsDisabled() {
      return this.disabled || !this.lookupEnabled
    },
    // principal_claim is the value source in both modes (default `sub`), but in
    // custom-identity mode that value is matched against the Custom identity name,
    // so call out the pairing there.
    tokenClaimHelp() {
      const dotNotation = 'Use dot notation for nested claims (for example, workload.id); escape literal periods with \\ (for example, workload\\.id).'
      if (this.selectedLookupMethod === 'custom-identity') {
        return `The token claim whose value is matched against the Custom identity name. Defaults to the subject (sub) claim, but you can specify a different claim if needed. ${dotNotation}`
      }
      return `Defaults to the subject (sub) claim, but you can specify a different token claim if needed. ${dotNotation}`
    },
  },
  methods: {
    handleEnableToggle(enabled) {
      if (this.onEnabledChange) {
        this.onEnabledChange(enabled)
      }
    },
    getTokenClaimInputValue() {
      const claim = this.formModel['config-principals-principal_claim']
      if (Array.isArray(claim) && claim.length > 0) {
        // Escape literal dots within each part before joining
        return claim.map(part => part.replace(/\./g, '\\.')).join('.')
      }
      if (typeof claim === 'string' && claim) {
        return claim
      }
      // Pre-fill the gateway default so users recognize `sub` is used when left unset.
      // The model stays empty until edited; an empty principal_claim already resolves to `sub`.
      return 'sub'
    },
    handleTokenClaimChange(rawValue) {
      const value = typeof rawValue === 'string' ? rawValue.trim() : ''
      if (!value) {
        this.updateField('config-principals-principal_claim', [])
        return
      }

      // Split on unescaped dots (dots not preceded by \), then unescape \. → .
      const parts = value.split(/(?<!\\)\./).map(part => part.replace(/\\\./g, '.').trim()).filter(Boolean)
      this.updateField('config-principals-principal_claim', parts)
    },
    handleMatchConsumerChange(checked) {
      this.updateField('config-principals-match_consumer', checked)
      if (!checked) {
        this.updateField('config-principals-match_consumer_groups', false)
      }
    },
    handleLookupMethodChange(value) {
      this.selectedLookupMethod = value
      if (value !== 'custom-identity') {
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-principal_by'] = null
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-principal_claim'] = null
        this.onModelUpdated()
      }
    },
    updateField(field, value) {
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel[field] = value
      this.onModelUpdated()
    },
  },
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
