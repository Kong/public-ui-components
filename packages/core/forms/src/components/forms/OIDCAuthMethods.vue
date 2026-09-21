<template>
  <div class="oidc-auth-methods">
    <KLabel>Authentication methods</KLabel>
    <KMultiselect
      :key="principalsMode"
      class="auth-methods-multiselect"
      data-testid="auth-methods-multiselect"
      :items="authMethodItems"
      :model-value="selectedAuthMethods"
      placeholder="Select authentication methods"
      @update:model-value="(value) => $emit('select', value)"
    />
    <p class="auth-methods-hint">
      Configure which OAuth and OpenID Connect features are supported.
    </p>

    <div class="session-management-section">
      <KLabel>Session management</KLabel>
      <div class="session-radio-group">
        <KRadio
          data-testid="session-radio-use"
          description="Issue a session cookie after successful authentication. Subsequent requests use the session instead of re-authenticating with the identity provider."
          label="Use sessions"
          :model-value="sessionManagement"
          :selected-value="true"
          @change="$emit('session-change', true)"
        />
        <KRadio
          data-testid="session-radio-no-use"
          description="Authenticate each request using the configured authentication flow."
          label="Do not use sessions"
          :model-value="sessionManagement"
          :selected-value="false"
          @change="$emit('session-change', false)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OIDCAuthMethods',
  props: {
    authMethodItems: {
      type: Array,
      default: () => [],
    },
    selectedAuthMethods: {
      type: Array,
      default: () => [],
    },
    sessionManagement: {
      type: Boolean,
      default: false,
    },
    // Used as a :key so the multiselect re-renders when the principals mode changes.
    principalsMode: {
      type: String,
      default: null,
    },
  },
  emits: ['select', 'session-change'],
}
</script>

<style lang="scss" scoped>
.oidc-auth-methods {
  :deep(.k-label) {
    margin-top: 0;
  }
}

.auth-methods-multiselect {
  margin-bottom: var(--kui-space-40, $kui-space-40);
}

.auth-methods-hint {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  margin: var(--kui-space-20, $kui-space-20) 0 0;
}

// Separate "Session management" from "Authentication methods" with the same gap the
// collapse uses between its field groups, so the rhythm stays consistent.
.session-management-section {
  margin-top: var(--kui-space-70, $kui-space-70);
}

.session-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>
