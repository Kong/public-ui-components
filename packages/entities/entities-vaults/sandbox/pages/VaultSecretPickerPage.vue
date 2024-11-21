<template>
  <div>
    <h2>
      VaultSecretPicker
    </h2>

    <div>
      <h3>Konnect API</h3>

      <KInput
        v-model.trim="konnectSecretRef"
        autocomplete="off"
        label="Token"
        placeholder="Raw token or secret reference"
        type="text"
      />

      <div class="look-up-key">
        Look up
        <span
          class="look-up-key-action"
          @click="() => konnectSecretPickerSetup = konnectSecretRef"
        >
          Key on Vault
        </span>
      </div>

      <VaultSecretPicker
        :config="konnectConfig"
        :setup="konnectSecretPickerSetup"
        @cancel="() => konnectSecretPickerSetup = false"
        @proceed="useKonnectSecretRef"
      />
    </div>

    <div>
      <h3>Kong Manager API</h3>

      <KInput
        v-model.trim="kongManagerSecretRef"
        autocomplete="off"
        label="Token"
        placeholder="Raw token or secret reference"
        type="text"
      />

      <div class="look-up-key">
        Look up
        <span
          class="look-up-key-action"
          @click="() => kongManagerSecretPickerSetup = kongManagerSecretRef"
        >
          Key on Vault
        </span>
      </div>

      <VaultSecretPicker
        :config="kongManagerConfig"
        :setup="kongManagerSecretPickerSetup"
        @cancel="() => kongManagerSecretPickerSetup = false"
        @proceed="useKongManagerSecretRef"
      />
    </div>
  </div>
</template>


<script setup lang="ts">
import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { ref } from 'vue'
import VaultSecretPicker from '../../src/components/VaultSecretPicker.vue'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const konnectConfig = ref<KonnectBaseFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api',
  controlPlaneId,
})

const kongManagerConfig = ref<KongManagerBaseFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager',
})

const konnectSecretPickerSetup = ref<string | false>(false)
const kongManagerSecretPickerSetup = ref<string | false>(false)

const konnectSecretRef = ref('{vault://kv-1/password/aaa}')
const kongManagerSecretRef = ref('{vault://env-1/password/aaa}')

const useKonnectSecretRef = (secretRef: string) => {
  konnectSecretRef.value = secretRef
  konnectSecretPickerSetup.value = false
}

const useKongManagerSecretRef = (secretRef: string) => {
  kongManagerSecretRef.value = secretRef
  kongManagerSecretPickerSetup.value = false
}
</script>

<style lang="scss" scoped>
.look-up-key {
  font-size: $kui-font-size-20;
  margin: $kui-space-40 0;

  &-action {
    color: $kui-color-text-primary;
    cursor: pointer;
  }
}
</style>
