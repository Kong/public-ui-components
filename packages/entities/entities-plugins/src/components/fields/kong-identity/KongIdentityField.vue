<template>
  <div
    class="kong-identity-field"
    data-testid="ff-kong-identity-field"
  >
    <KLabel data-testid="ff-kong-identity-label">
      {{ t('custom_field.kong_identity.title') }}
    </KLabel>

    <p class="kong-identity-description">
      {{ descriptionText }}
      <a
        class="kong-identity-learn-more"
        href="https://developer.konghq.com/kong-identity/"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('custom_field.kong_identity.learn_more') }}
      </a>
    </p>

    <div class="kong-identity-options">
      <KSkeletonBox
        v-if="loadingRealms"
        class="kong-identity-options-skeleton"
      />

      <template v-else>
        <KRadio
          card
          card-orientation="horizontal"
          data-testid="kong-identity-mode-consumers"
          :description="consumersDescription"
          :label="t('custom_field.kong_identity.consumers_label')"
          :model-value="selectedMode"
          selected-value="consumers"
          @update:model-value="handleModeChange"
        >
          <TeamIcon :size="KUI_ICON_SIZE_50" />
        </KRadio>

        <KRadio
          v-if="showCentrallyManaged"
          card
          card-orientation="horizontal"
          data-testid="kong-identity-mode-centrally-managed"
          :description="t('custom_field.kong_identity.centrally_managed_description')"
          :label="t('custom_field.kong_identity.centrally_managed_label')"
          :model-value="selectedMode"
          selected-value="centrally-managed"
          @update:model-value="handleModeChange"
        >
          <AccountTreeIcon :size="KUI_ICON_SIZE_50" />
        </KRadio>

        <KRadio
          card
          card-orientation="horizontal"
          data-testid="kong-identity-mode-kong-identity"
          :description="kongIdentityDescription"
          :label="t('custom_field.kong_identity.kong_identity_label')"
          :model-value="selectedMode"
          selected-value="kong-identity"
          @update:model-value="handleModeChange"
        >
          <KeyIcon :size="KUI_ICON_SIZE_50" />
        </KRadio>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { KLabel, KRadio, KSkeletonBox } from '@kong/kongponents'
import { TeamIcon, AccountTreeIcon, KeyIcon } from '@kong/icons'
import { KUI_ICON_SIZE_50 } from '@kong/design-tokens'
import { useFormShared } from '../../free-form/shared/composables'
import composables from '../../../composables'

import type { AuthMode } from './types'

defineOptions({ name: 'KongIdentityField' })

const props = defineProps<{
  identityRealmsInSchema?: boolean
  hasExistingRealms?: boolean
  loadingRealms?: boolean
}>()
const { i18n } = composables.useI18n()
const { t } = i18n

const { formData, getSchema, getEmptyOrDefault } = useFormShared()

// Determine if schema has identity_realms
const identityRealmsInSchema = computed(() => {
  if (props.identityRealmsInSchema !== undefined) return props.identityRealmsInSchema
  return !!getSchema('$.config.identity_realms')
})

const showCentrallyManaged = computed(() => identityRealmsInSchema.value && !!props.hasExistingRealms)

const descriptionText = computed(() => {
  return identityRealmsInSchema.value
    ? t('custom_field.kong_identity.description_with_realms')
    : t('custom_field.kong_identity.description_without_realms')
})

const consumersDescription = computed(() => {
  return identityRealmsInSchema.value
    ? t('custom_field.kong_identity.consumers_description_key_auth')
    : t('custom_field.kong_identity.consumers_description_basic_auth')
})

const kongIdentityDescription = computed(() => {
  return identityRealmsInSchema.value
    ? t('custom_field.kong_identity.kong_identity_description_key_auth')
    : t('custom_field.kong_identity.kong_identity_description_basic_auth')
})

const model = defineModel<AuthMode>()
const selectedMode = ref<AuthMode>(model.value ?? 'consumers')

function handleModeChange(mode: AuthMode) {
  if (!formData.config) return
  if (mode === selectedMode.value) return

  selectedMode.value = mode
  model.value = mode

  switch (mode) {
    case 'kong-identity': {
      // `directory` is a placeholder; ConfigFormContent resolves the real directory name
      // from the shared /v2/directories lookup and overwrites it on entering this mode.
      formData.config.principals = { ...getEmptyOrDefault('$.config.principals'), enabled: true, directory: 'default' }
      if (identityRealmsInSchema.value) {
        formData.config.identity_realms = []
      }
      if (!getSchema('$.config.realm')?.required) {
        formData.config.realm = null
      }
      break
    }
    case 'consumers': {
      const principalsRequired = !!getSchema('$.config.principals')?.required
      formData.config.principals = principalsRequired ? getEmptyOrDefault('$.config.principals') : null
      if (identityRealmsInSchema.value) {
        formData.config.identity_realms = []
      }
      break
    }
    case 'centrally-managed': {
      const principalsRequired = !!getSchema('$.config.principals')?.required
      formData.config.principals = principalsRequired ? getEmptyOrDefault('$.config.principals') : null
      formData.config.identity_realms = [{ scope: 'cp', id: null, region: null }]
      break
    }
  }
}
</script>

<style lang="scss" scoped>
.kong-identity-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  margin: var(--kui-space-20, $kui-space-20) 0 0;
}

.kong-identity-learn-more {
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.kong-identity-options {
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);
  margin-top: var(--kui-space-40, $kui-space-40);

  .kong-identity-options-skeleton {
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    width: 100%;
  }

  :deep(.k-radio.radio-card) {
    flex: 1;

    .radio-card-wrapper.radio-label-wrapper {
      flex-direction: column !important;
      justify-content: flex-start !important;
    }

    &.card-horizontal .radio-card-wrapper .card-content-wrapper {
      align-self: flex-start !important;
      height: max-content;
    }
  }
}
</style>

