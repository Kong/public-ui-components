<template>
  <KEmptyState
    class="documentation-page-empty-state"
    data-testid="documentation-page-empty-state"
    icon="stateGruceo"
    icon-size="96"
  >
    <template #title>
      {{ i18n.t('documentation.show.empty_state.title') }}
    </template>
    <template #message>
      {{ i18n.t('documentation.show.empty_state.message') }}
    </template>
    <template #cta>
      <PermissionsWrapper
        :auth-function="() => canEdit()"
      >
        <KButton
          appearance="primary"
          data-testid="add-new-page-button"
          icon="plus"
          @click="emit('create-documentation')"
        >
          {{ i18n.t('documentation.show.empty_state.ctaText') }}
        </KButton>
      </PermissionsWrapper>
    </template>
  </KEmptyState>
</template>

<script setup lang="ts">
import composables from '../composables'
import type { PropType } from 'vue'

defineProps({
  /**
   * A synchronous or asynchronous function which returns a boolean evaluating
   * if the user can edit an entity by create a new document
   */
  canEdit: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
})

const emit = defineEmits(['create-documentation'])

const { i18n } = composables.useI18n()
</script>
