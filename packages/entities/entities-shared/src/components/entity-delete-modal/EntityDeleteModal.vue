<template>
  <KPrompt
    action-button-appearance="danger"
    :action-button-disabled="actionPending"
    action-button-text="Yes, delete"
    :class="['kong-ui-entity-delete-modal', { 'kong-ui-entity-delete-modal-stacked-copy': stackedCopy }]"
    :confirmation-prompt="confirmationPrompt || undefined"
    :confirmation-text="confirmText"
    :title="title"
    :visible="visible"
    @cancel="cancel"
    @proceed="proceed"
  >
    <template #default>
      <div
        class="body"
        :class="{ 'body-stacked-copy': stackedCopy }"
      >
        <div
          v-if="error"
          class="kong-ui-entity-delete-error"
        >
          <KAlert appearance="danger">
            <template #default>
              {{ error }}
            </template>
          </KAlert>
        </div>
        <slot name="message">
          <i18n-t
            class="message"
            :keypath="props.entityName ? 'deleteModal.messageWithName' : 'deleteModal.message'"
            tag="p"
          >
            <template #entityType>
              {{ entityLabel }}
            </template>
            <template
              v-if="props.entityName"
              #entityName
            >
              <strong>
                {{ props.entityName }}
              </strong>
            </template>
          </i18n-t>
        </slot>
        <div
          v-if="props.description || $slots.description"
          class="description"
        >
          <slot name="description">
            <p>
              {{ props.description }}
            </p>
          </slot>
        </div>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import composables from '../../composables'
import type { EntityTypes } from '../../types'

const { i18nT } = composables.useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Delete',
  },
  entityType: {
    type: String as PropType<EntityTypes>,
    required: true,
  },
  entityName: {
    type: String,
    default: '',
  },
  entityTypeDisplay: {
    type: String,
    default: '',
  },
  needConfirm: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  },
  actionPending: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  confirmationPrompt: {
    type: String,
    default: '',
  },
  // Konnect-managed Redis delete UI
  stackedCopy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'proceed'): void
}>()

const entityLabel = computed(() =>
  props.entityTypeDisplay.trim() !== '' ? props.entityTypeDisplay : props.entityType,
)

const confirmText = computed(() => props.needConfirm ? props.entityName : '')

const cancel = () => {
  emit('cancel')
}

const proceed = () => {
  emit('proceed')
}
</script>

<style lang="scss" scoped>
.kong-ui-entity-delete-modal {
  .message,
  .description {
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin: var(--kui-space-0, $kui-space-0);
  }

  .message strong {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .description {
    margin-top: var(--kui-space-90, $kui-space-90);
  }

  .body-stacked-copy .description {
    margin-top: var(--kui-space-0, $kui-space-0);
  }

  .body-stacked-copy .description > p {
    margin: var(--kui-space-0, $kui-space-0);
  }

  .body-stacked-copy .message {
    margin-bottom: var(--kui-space-0, $kui-space-0);
  }

  :deep(.prompt-confirmation-text) {
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin: var(--kui-space-0, $kui-space-0);
  }
}

.kong-ui-entity-delete-modal-stacked-copy {
  :deep(.prompt-content + .prompt-confirmation-container) {
    margin-top: var(--kui-space-90, $kui-space-90);
  }
}

.kong-ui-entity-delete-error {
  margin-bottom: var(--kui-space-50, $kui-space-50);
}
</style>
