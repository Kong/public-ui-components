<template>
  <KPrompt
    action-button-appearance="danger"
    :action-button-disabled="actionPending"
    action-button-text="Yes, delete"
    class="kong-ui-entity-delete-modal"
    :confirmation-text="confirmText"
    :title="title"
    :visible="visible"
    @cancel="cancel"
    @proceed="proceed"
  >
    <template #default>
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
      <i18n-t
        class="message"
        :keypath="props.entityName ? 'deleteModal.messageWithName' : 'deleteModal.message'"
        tag="p"
      >
        <template #entityType>
          {{ props.entityType }}
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
    default: false,
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
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'proceed'): void
}>()

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
    line-height: 24px;
    margin: 0;
  }

  .message strong {
    font-weight: 600;
  }

  .description {
    margin-top: 32px;
  }
}

.kong-ui-entity-delete-error {
  margin-bottom: 16px;
}
</style>
