<template>
  <div class="kong-ui-entities-auth-plugin-onboarding-card">
    <OnboardingCard
      :items="items"
      :subtitle="t(`onboarding.${pluginType}.subtitle`)"
      :title="t(`onboarding.${pluginType}.title`)"
      @dismiss="$emit('dismiss')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KeyIcon, PeopleIcon } from '@kong/icons'
import { OnboardingCard } from '@kong-ui-public/entities-shared'
import type { OnboardingCardItem } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'
import composables from '../composables'
import type { AuthOnboardingPluginType } from '../types'

const { i18n: { t } } = composables.useI18n()

const {
  pluginType,
  hasConsumers,
  createConsumerTo,
  addCredentialTo,
} = defineProps<{
  /** The auth plugin type this banner is shown for. */
  pluginType: AuthOnboardingPluginType
  /** Whether the current control plane/workspace already has at least one consumer. */
  hasConsumers: boolean
  /** Route to navigate to for creating a consumer with a matching credential/grant. */
  createConsumerTo: RouteLocationRaw
  /** Route to navigate to for adding a credential/grant to an existing consumer. If omitted, only the "create consumer" item is shown. */
  addCredentialTo?: RouteLocationRaw
}>()

defineEmits<{
  dismiss: []
}>()

const items = computed((): OnboardingCardItem[] => {
  const result: OnboardingCardItem[] = [
    {
      icon: PeopleIcon,
      appearance: 'decorative-aqua',
      title: t('onboarding.create_consumer.title'),
      description: t(`onboarding.${pluginType}.create_consumer.description`),
      to: createConsumerTo,
    },
  ]

  if (hasConsumers && addCredentialTo) {
    result.push({
      icon: KeyIcon,
      appearance: 'decorative-purple',
      title: t(`onboarding.${pluginType}.add_credential.title`),
      description: t(`onboarding.${pluginType}.add_credential.description`),
      to: addCredentialTo,
    })
  }

  return result
})
</script>
