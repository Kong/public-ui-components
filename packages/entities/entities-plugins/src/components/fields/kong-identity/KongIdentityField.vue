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
          v-for="option in modeOptions"
          :key="option.mode"
          card
          card-orientation="horizontal"
          :data-testid="option.testId"
          :description="option.description"
          :label="option.label"
          :model-value="selectedMode"
          :selected-value="option.mode"
          @update:model-value="handleModeChange"
        >
          <component
            :is="option.icon"
            :size="`var(--kui-icon-size-50, ${KUI_ICON_SIZE_50})`"
          />
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
import { useFormShared } from '@kong-ui-public/freeform'
import composables from '../../../composables'

import type { Component } from 'vue'
import type { AuthMode } from './types'

defineOptions({ name: 'KongIdentityField' })

const props = defineProps<{
  identityRealmsInSchema?: boolean
  loadingRealms?: boolean
  /** Host opted in to listing Kong Identity principals first (AI Manager auth strategies). */
  prioritizePrincipals?: boolean
}>()
const { i18n } = composables.useI18n()
const { t } = i18n

const { formData, getSchema, getEmptyOrDefault } = useFormShared()

// Determine if schema has identity_realms
const identityRealmsInSchema = computed(() => {
  if (props.identityRealmsInSchema !== undefined) return props.identityRealmsInSchema
  return !!getSchema('$.config.identity_realms')
})

// Launch decision: Centrally Managed is shown unconditionally whenever the schema
// supports identity_realms — we intentionally do NOT hide it when no realms exist yet.
// Hiding it (platform-wide) is deferred to a fast-follow.
const showCentrallyManaged = computed(() => identityRealmsInSchema.value)

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

type ModeOption = {
  mode: AuthMode
  testId: string
  label: string
  description: string
  icon: Component
}

// AI Manager auth strategies list Kong Identity principals first; every other host
// keeps Consumers first. The order is rendered from this list rather than CSS so the
// DOM order matches what users see.
const modeOptions = computed<ModeOption[]>(() => {
  const kongIdentity: ModeOption = {
    mode: 'kong-identity',
    testId: 'kong-identity-mode-kong-identity',
    label: t('custom_field.kong_identity.kong_identity_label'),
    description: kongIdentityDescription.value,
    icon: KeyIcon,
  }
  const consumers: ModeOption = {
    mode: 'consumers',
    testId: 'kong-identity-mode-consumers',
    label: t('custom_field.kong_identity.consumers_label'),
    description: consumersDescription.value,
    icon: TeamIcon,
  }
  const centrallyManaged: ModeOption = {
    mode: 'centrally-managed',
    testId: 'kong-identity-mode-centrally-managed',
    label: t('custom_field.kong_identity.centrally_managed_label'),
    description: t('custom_field.kong_identity.centrally_managed_description'),
    icon: AccountTreeIcon,
  }

  const options = props.prioritizePrincipals ? [kongIdentity, consumers] : [consumers]
  if (showCentrallyManaged.value) options.push(centrallyManaged)
  if (!props.prioritizePrincipals) options.push(kongIdentity)
  return options
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
      // `directory` starts as 'default'; ConfigFormContent's selectedMode watcher overwrites it
      // with the host-resolved principalsDirectoryName once this mode change is detected.
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
        formData.config.identity_realms = [{ scope: 'cp' }]
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
  font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  gap: var(--kui-space-20, $kui-space-20);
  outline: none;
  text-decoration: none;

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

