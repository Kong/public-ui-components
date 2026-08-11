<template>
  <KSkeleton
    v-if="loading"
    class="kong-identity-principals-skeleton"
    data-testid="kong-identity-principals-loading"
  />

  <KEmptyState
    v-else-if="showPanel"
    class="kong-identity-principals"
    data-testid="kong-identity-principals-panel"
    :message="t('custom_field.kong_identity.configure_description')"
    :title="t('custom_field.kong_identity.configure_title')"
  >
    <template #icon />

    <template #action>
      <KButton
        appearance="primary"
        data-testid="kong-identity-create-principal"
        @click="showLeavePrompt = true"
      >
        <AddIcon decorative />
        {{ t('custom_field.kong_identity.create_principal') }}
      </KButton>

      <KButton
        appearance="secondary"
        class="open-learning-hub"
        data-testid="kong-identity-principals-learn-more"
        @click="emit('click:learn-more', 'kong-identity')"
      >
        <BookIcon decorative />
        {{ t('custom_field.kong_identity.configure_learn_more') }}
      </KButton>
    </template>
  </KEmptyState>

  <KAlert
    v-else-if="dataPlaneIncompatible"
    appearance="warning"
    class="kong-identity-dp-version-alert"
    data-testid="kong-identity-dp-version-alert"
    :message="t('custom_field.kong_identity.incompatible_data_plane_alert')"
    show-icon
  />

  <KPrompt
    :action-button-text="t('custom_field.kong_identity.leave_prompt_action')"
    data-testid="kong-identity-create-principal-prompt"
    :message="t('custom_field.kong_identity.leave_prompt_message')"
    :title="t('custom_field.kong_identity.leave_prompt_title')"
    :visible="showLeavePrompt"
    @cancel="showLeavePrompt = false"
    @proceed="handleCreatePrincipal"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { KAlert, KButton, KEmptyState, KPrompt } from '@kong/kongponents'
import { AddIcon, BookIcon } from '@kong/icons'
import composables from '../../../composables'

defineOptions({ name: 'PrincipalsCreationGuide' })

defineProps<{
  /** Whether the directory/principal lookup is still in flight */
  loading?: boolean
  /** Whether to show the "create your first principal" empty-state panel */
  showPanel?: boolean
  /** Whether a connected data plane node can't process Kong Identity principals (Gateway 3.15+ required) */
  dataPlaneIncompatible?: boolean
}>()

const emit = defineEmits<{
  'click:learn-more': [entity: string]
  /** Emitted when the user clicks "Create principal"; the consuming app owns navigation */
  'click:create-entity': [payload: { type: 'principal' }]
}>()

const { i18n } = composables.useI18n()
const { t } = i18n

// Creating a principal navigates away from the form; confirm before losing unsaved changes.
const showLeavePrompt = ref(false)

const handleCreatePrincipal = () => {
  showLeavePrompt.value = false
  emit('click:create-entity', { type: 'principal' })
}
</script>

<style lang="scss" scoped>
.kong-identity-principals-skeleton {
  margin-top: var(--kui-space-50, $kui-space-50);

  // KSkeletonBox caps its own width (80px) and height (8/16px) via its own
  // scoped rules; override both to roughly match the empty-state panel so the
  // loading state doesn't flash as a thin sliver.
  &.skeleton-box {
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    height: 240px !important;
    width: 100% !important;
  }
}

.kong-identity-principals {
  background-color: var(--kui-color-background-decorative-purple-weakest, $kui-color-background-decorative-purple-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  margin-top: var(--kui-space-50, $kui-space-50);
  padding: var(--kui-space-80, $kui-space-80);

  // No icon in this empty state
  :deep(.empty-state-icon) {
    display: none;
  }

  // Render the two action buttons (Create principal + Learn more) side by side
  :deep(.empty-state-action) {
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
  }
}
</style>
