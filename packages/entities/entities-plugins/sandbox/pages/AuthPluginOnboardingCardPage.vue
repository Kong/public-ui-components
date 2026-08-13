<template>
  <div class="onboarding-sandbox">
    <div class="sandbox-controls">
      <KSelect
        v-model="pluginType"
        class="plugin-type-select"
        :items="pluginTypeItems"
        label="Plugin type"
      />
      <KSelect
        v-model="authMode"
        class="plugin-type-select"
        :items="authModeItems"
        label="Auth mode"
      />
      <KInputSwitch
        v-model="hasExistingEntity"
        label="Control plane already has a matching consumer/principal"
      />
    </div>

    <AuthPluginOnboardingCard
      v-if="visible"
      :add-credential-to="{ name: 'add-credential-to-consumer-form', params: { plugin: pluginType } }"
      :auth-mode="authMode"
      :create-entity-to="{ name: 'create-consumer-credential-form', params: { plugin: pluginType } }"
      :has-existing-entity="hasExistingEntity"
      :plugin-type="pluginType"
      @dismiss="visible = false"
    />
    <KButton
      v-else
      @click="visible = true"
    >
      Show card
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AuthPluginOnboardingCard } from '../../src'
import type { AuthMode, AuthOnboardingPluginType } from '../../src'

const visible = ref(true)
const hasExistingEntity = ref(true)
const pluginType = ref<AuthOnboardingPluginType>('key-auth')
const authMode = ref<AuthMode>('consumers')

const pluginTypeItems = [
  { label: 'key-auth', value: 'key-auth' },
  { label: 'key-auth-enc', value: 'key-auth-enc' },
  { label: 'basic-auth', value: 'basic-auth' },
  { label: 'oauth2', value: 'oauth2' },
  { label: 'hmac-auth', value: 'hmac-auth' },
  { label: 'jwt', value: 'jwt' },
  { label: 'acl', value: 'acl' },
]

const authModeItems = [
  { label: 'consumers', value: 'consumers' },
  { label: 'centrally-managed', value: 'centrally-managed' },
  { label: 'kong-identity', value: 'kong-identity' },
]
</script>

<style lang="scss" scoped>
.onboarding-sandbox {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;

  .sandbox-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .plugin-type-select {
    width: 300px;
  }
}
</style>
