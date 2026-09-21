<template>
  <SandboxPage title="Auth Plugin Onboarding Card">
    <template #controls>
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
    </template>

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
  </SandboxPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SandboxPage from '../SandboxPage.vue'
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
.plugin-type-select {
  width: 300px;
}
</style>
