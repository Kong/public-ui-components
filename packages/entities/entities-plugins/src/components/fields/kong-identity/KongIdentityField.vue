<template>
  <div
    class="kong-identity-field"
    data-testid="ff-kong-identity-field"
  >
    <KLabel data-testid="ff-kong-identity-label">
      {{ t('custom_field.kong_identity.title') }}
    </KLabel>

    <div class="kong-identity-options">
      <KRadio
        v-model="selectedMode"
        card
        card-orientation="horizontal"
        data-testid="kong-identity-mode-kong-identity"
        :description="t('custom_field.kong_identity.kong_identity_description')"
        :label="t('custom_field.kong_identity.kong_identity_label')"
        selected-value="kong-identity"
        @update:model-value="handleModeChange"
      />

      <KRadio
        v-model="selectedMode"
        card
        card-orientation="horizontal"
        data-testid="kong-identity-mode-consumers"
        :description="t('custom_field.kong_identity.consumers_description')"
        :label="t('custom_field.kong_identity.consumers_label')"
        selected-value="consumers"
        @update:model-value="handleModeChange"
      />

      <KRadio
        v-if="hasIdentityRealms"
        v-model="selectedMode"
        card
        card-orientation="horizontal"
        data-testid="kong-identity-mode-centrally-managed"
        :description="t('custom_field.kong_identity.centrally_managed_description')"
        :label="t('custom_field.kong_identity.centrally_managed_label')"
        selected-value="centrally-managed"
        @update:model-value="handleModeChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { KRadio } from '@kong/kongponents'
import { useFormShared } from '../../free-form/shared/composables'
import composables from '../../../composables'

import type { AuthMode, KongIdentityPrincipals } from './types'
import type { IdentityRealmItem } from '../key-auth-identity-realms/types'

defineOptions({ name: 'KongIdentityField' })

const props = defineProps<{
  hasIdentityRealms?: boolean
}>()

const { i18n } = composables.useI18n()
const { t } = i18n

const { formData, getSchema } = useFormShared()

// Determine if schema has identity_realms
const hasIdentityRealms = computed(() => {
  if (props.hasIdentityRealms !== undefined) return props.hasIdentityRealms
  try {
    return !!getSchema('$.config.identity_realms')
  } catch {
    return false
  }
})

// Derive initial mode from existing data
function deriveMode(): AuthMode {
  const principals = formData.config?.principals as KongIdentityPrincipals | null | undefined
  const realms = formData.config?.identity_realms as IdentityRealmItem[] | null | undefined

  if (principals?.enabled) {
    return 'kong-identity'
  }
  if (Array.isArray(realms) && realms.length > 0) {
    return 'centrally-managed'
  }
  return 'consumers'
}

const selectedMode = ref<AuthMode>(deriveMode())
const userSelectedMode = ref(false)

// Watch for external data changes (e.g. edit mode population)
watch(() => formData.config, () => {
  if (userSelectedMode.value) return
  const derived = deriveMode()
  if (derived !== selectedMode.value) {
    selectedMode.value = derived
  }
}, { deep: true })

function handleModeChange(mode: AuthMode) {
  if (!formData.config) return

  userSelectedMode.value = true

  switch (mode) {
    case 'kong-identity':
      formData.config.principals = { enabled: true, directory: 'default' }
      if (hasIdentityRealms.value) {
        formData.config.identity_realms = null
      }
      break
    case 'consumers':
      formData.config.principals = null
      if (hasIdentityRealms.value) {
        formData.config.identity_realms = null
      }
      break
    case 'centrally-managed':
      formData.config.principals = null
      formData.config.identity_realms = [{ scope: 'cp', id: null, region: null }]
      break
  }
}
</script>

<style lang="scss" scoped>
.kong-identity-options {
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
  margin-top: var(--kui-space-40, $kui-space-40);
}
</style>

