<template>
  <Teleport
    to="body"
  >
    <KPrompt
      :action-button-disabled="isPending"
      :action-button-text="actionButtonText"
      :data-testid="`${entityType}-${entityId}-toggle-prompt`"
      :title="title"
      :visible="visible"
      @cancel="handleCancel"
      @proceed="handleConfirm"
    >
      <template #default>
        <i18nT
          :keypath="`toggleModal.${props.action}.message`"
          scope="global"
        >
          <template #entityType>
            {{ entityType }}
          </template>
          <template #entityName>
            <strong>
              {{ entityName }}
            </strong>
          </template>
        </i18nT>
      </template>
    </KPrompt>
  </Teleport>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'

import composables from '../../composables'

const { i18n: { t }, i18nT } = composables.useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  action: {
    type: String, // 'enable' | 'disable'
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  entityName: {
    type: String,
    required: true,
  },
  onConfirm: {
    type: Function as PropType<() => Promise<any>> | null,
    required: false,
    default: null,
  },
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'proceed'): void
}>()

const isPending = ref(false)

const title = computed((): string => props.action === 'enable'
  ? t('toggleModal.enable.title', { entityType: props.entityType })
  : t('toggleModal.disable.title', { entityType: props.entityType }),
)

const actionButtonText = computed((): string => props.action === 'enable'
  ? t('toggleModal.enable.confirmText')
  : t('toggleModal.disable.confirmText'),
)

const handleCancel = (): void => emit('cancel')

const handleConfirm = async (): Promise<void> => {
  if (props.onConfirm) {
    isPending.value = true
    try {
      await props.onConfirm()
      emit('proceed')
    } catch (e) {
      console.error(e)
    } finally {
      isPending.value = false
    }
  }
}

</script>
