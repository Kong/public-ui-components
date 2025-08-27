<template>
  <Teleport to="body">
    <KPrompt
      action-button-appearance="danger"
      :action-button-text="i18n.t('documentation.form_modal.discard_changes')"
      cancel-button-appearance="secondary"
      :cancel-button-text="i18n.t('documentation.form_modal.continue_editing')"
      :confirmation-text="confirmationText"
      data-testid="discard-changes-prompt"
      :message="i18n.t('documentation.form_modal.discard_changes_message')"
      :modal-attributes="{ maxWidth: '640' }"
      :title="i18n.t('documentation.form_modal.discard_changes_title')"
      :visible="modalVisible"
      @cancel="emit('cancel')"
      @proceed="emit('discard-changes')"
    />
  </Teleport>
</template>

<script setup lang="ts">
import composables from '../composables'
import { ref, watch } from 'vue'


const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'discard-changes'): void
}>()

const props = defineProps({
  /** If the modal is visible. */
  visible: {
    type: Boolean,
    default: false,
  },
  /** To require the user to type text before confirming, provide the confirmationText as a prop */
  confirmationText: {
    type: String,
    default: undefined,
  },
})

const { i18n } = composables.useI18n()

const modalVisible = ref<boolean>(props.visible)
watch(() => props.visible, (visible) => {
  modalVisible.value = visible
}, { immediate: true })
</script>
