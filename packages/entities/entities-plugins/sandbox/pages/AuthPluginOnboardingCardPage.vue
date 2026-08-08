<template>
  <div class="onboarding-sandbox">
    <div class="sandbox-controls">
      <KSelect
        v-model="pluginType"
        class="plugin-type-select"
        :items="pluginTypeItems"
        label="Plugin type"
      />
      <KInputSwitch
        v-model="hasConsumers"
        label="Control plane already has consumers"
      />
    </div>

    <AuthPluginOnboardingCard
      v-if="visible"
      :add-credential-to="{ name: 'add-credential-to-consumer-form', params: { plugin: pluginType } }"
      :create-consumer-to="{ name: 'create-consumer-credential-form', params: { plugin: pluginType } }"
      :has-consumers="hasConsumers"
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
import type { AuthOnboardingPluginType } from '../../src'

const visible = ref(true)
const hasConsumers = ref(true)
const pluginType = ref<AuthOnboardingPluginType>('key-auth')

const pluginTypeItems = [
  { label: 'key-auth', value: 'key-auth' },
  { label: 'key-auth-enc', value: 'key-auth-enc' },
  { label: 'basic-auth', value: 'basic-auth' },
  { label: 'oauth2', value: 'oauth2' },
  { label: 'hmac-auth', value: 'hmac-auth' },
  { label: 'jwt', value: 'jwt' },
  { label: 'acl', value: 'acl' },
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
