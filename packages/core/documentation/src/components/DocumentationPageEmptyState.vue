<template>
  <KEmptyState
    class="documentation-page-empty-state"
    data-testid="documentation-page-empty-state"
  >
    <template #icon>
      <KongIcon />
    </template>
    <template #title>
      {{ i18n.t('documentation.show.empty_state.title') }}
    </template>
    <template #default>
      {{ i18n.t('documentation.show.empty_state.message') }}
    </template>
    <template #action>
      <PermissionsWrapper :auth-function="() => canEdit()">
        <KButton
          data-testid="add-new-page-button"
          @click="emit('create-documentation')"
        >
          <AddIcon />
          {{ i18n.t('documentation.show.empty_state.ctaText') }}
        </KButton>
      </PermissionsWrapper>
    </template>
  </KEmptyState>
</template>

<script setup lang="ts">
import composables from '../composables'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'
import { AddIcon, KongIcon } from '@kong/icons'
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
