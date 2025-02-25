<template>
  <KModal
    :action-button-text="t('actions.close')"
    data-testid="remove-links-modal"
    hide-cancel-button
    max-width="640"
    :title="t('delete.title')"
    :visible="visible"
    @cancel="handleClose"
    @proceed="handleClose"
  >
    {{ t('delete.warning') }}
  </KModal>
</template>

<script setup lang="ts">
import composables from '../composables'

const { i18n: { t } } = composables.useI18n()

defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('close')
}
</script>
