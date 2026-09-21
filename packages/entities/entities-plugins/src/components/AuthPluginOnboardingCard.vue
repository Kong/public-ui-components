<template>
  <OnboardingCard
    :items="items"
    :subtitle="t(`onboarding.${pluginType}.subtitle`)"
    :title="t(`onboarding.${pluginType}.title`)"
    @dismiss="$emit('dismiss')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GroupsIcon, PasskeyIcon } from '@kong/icons'
import { OnboardingCard } from '@kong-ui-public/entities-shared'
import type { OnboardingCardItem } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'
import composables from '../composables'
import type { AuthOnboardingPluginType } from '../types'
import type { AuthMode } from './fields/kong-identity/types'

const { i18n: { t } } = composables.useI18n()

const {
  pluginType,
  authMode,
  hasExistingEntity,
  createEntityTo,
  onCreateEntityClick,
  addCredentialTo,
  onAddCredentialClick,
} = defineProps<{
  /** The auth plugin type this banner is shown for. */
  pluginType: AuthOnboardingPluginType
  /** Which mode the plugin was configured to manage authentication with (consumers, centrally-managed consumers, or Kong Identity principals). */
  authMode: AuthMode
  /** Whether the current control plane/workspace already has at least one entity (consumer or principal, depending on `authMode`) matching the required kind. */
  hasExistingEntity: boolean
  /** Route to navigate to for creating a consumer/principal with a matching credential/grant. Mutually exclusive with `onCreateEntityClick`. */
  createEntityTo?: RouteLocationRaw
  /** Click handler to run instead of navigating (e.g. to open a modal) when creating a consumer/principal. Mutually exclusive with `createEntityTo`. */
  onCreateEntityClick?: () => void
  /** Route to navigate to for adding a credential/grant to an existing consumer/principal. Mutually exclusive with `onAddCredentialClick`. If neither is given, only the "create" item is shown. */
  addCredentialTo?: RouteLocationRaw
  /** Click handler to run instead of navigating (e.g. to open a modal) when adding a credential/grant. Mutually exclusive with `addCredentialTo`. */
  onAddCredentialClick?: () => void
}>()

defineEmits<{
  dismiss: []
}>()

const items = computed((): OnboardingCardItem[] => {
  const isKongIdentity = authMode === 'kong-identity'

  const result: OnboardingCardItem[] = [
    {
      icon: GroupsIcon,
      appearance: 'decorative-aqua',
      title: isKongIdentity ? t('onboarding.create_principal.title') : t('onboarding.create_consumer.title'),
      description: isKongIdentity
        ? t('onboarding.create_principal.description')
        : t(`onboarding.${pluginType}.create_consumer.description`),
      to: createEntityTo,
      onClick: onCreateEntityClick,
    },
  ]

  if (hasExistingEntity && (addCredentialTo || onAddCredentialClick)) {
    result.push({
      icon: PasskeyIcon,
      appearance: 'decorative-purple',
      title: isKongIdentity ? t('onboarding.add_principal_credential.title') : t(`onboarding.${pluginType}.add_credential.title`),
      description: isKongIdentity
        ? t('onboarding.add_principal_credential.description')
        : t(`onboarding.${pluginType}.add_credential.description`),
      to: addCredentialTo,
      onClick: onAddCredentialClick,
    })
  }

  return result
})
</script>
