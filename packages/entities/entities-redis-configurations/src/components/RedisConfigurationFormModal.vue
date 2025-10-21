<template>
  <KModal
    class="redis-configuration-partial-form"
    data-testid="redis-partial-form-modal"
    full-screen
    :title="t('form.redis_partial_modal_title')"
    :visible="modalVisible"
    @cancel="handleClose"
  >
    <RedisConfigurationForm
      :action-teleport-target="modalActionTeleportTarget"
      :config="formConfig"
      :disable-cancel-route-redirection="disableCancelRouteRedirection"
      :disabled-partial-type="disabledPartialType"
      :slidout-top-offset="0"
      @cancel="handleClose"
      @error="onError"
      @update="onUpdated"
    />
    <template #footer>
      <div
        :id="`redis-modal-footer-${id}`"
        class="redis-modal-footer"
      />
    </template>
  </KModal>
</template>

<script setup lang="ts">
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { ref, nextTick, watch, computed, inject, useId } from 'vue'
import { useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

import { PartialType, type RedisConfigurationResponse } from '../types'
import RedisConfigurationForm from './RedisConfigurationForm.vue'
import useI18n from '../composables/useI18n'

import type { AxiosError } from 'axios'

export interface RedisConfigurationFormModalProps {
  /** Whether the modal is visible */
  visible: boolean
  /** The partial type to create */
  partialType?: 'redis-ce' | 'redis-ee'
  /**
   * Disable automatic redirection to cancel route when cancel is triggered
   */
  disableCancelRouteRedirection?: boolean
}

const {
  partialType = 'redis-ee',
  visible,
} = defineProps<RedisConfigurationFormModalProps>()

const emit = defineEmits<{
  'toast': [payload: { message: string, appearance: 'success' | 'danger' }]
  'modal-close': []
  'created': [data: RedisConfigurationResponse]
}>()

const { i18n: { t } } = useI18n()
const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig>(FORMS_CONFIG)!
const { getMessageFromError } = useErrors()
const id = useId()

const disabledPartialType = computed(() => {
  switch (partialType) {
    case PartialType.REDIS_CE:
      return PartialType.REDIS_EE
    case PartialType.REDIS_EE:
      return PartialType.REDIS_CE
    default:
      return undefined
  }
})

const modalVisible = ref(false)
const modalActionTeleportTarget = ref<string>()

const onError = (error: AxiosError) => {
  emit('toast', {
    message: getMessageFromError(error),
    appearance: 'danger',
  })
}

const onUpdated = (data: RedisConfigurationResponse) => {
  emit('toast', {
    message: t('form.partial_created_success_message'),
    appearance: 'success',
  })
  handleClose()
  emit('created', data)
}

const handleClose = () => {
  modalActionTeleportTarget.value = undefined
  emit('modal-close')
  nextTick(() => {
    modalVisible.value = false
  })
}

watch(
  () => visible,
  (visible) => {
    if (visible) {
      modalVisible.value = true
      nextTick(() => {
        modalActionTeleportTarget.value = `#redis-modal-footer-${id}`
      })
    }
  },
)
</script>

<style scoped lang="scss">
.redis-configuration-partial-form {
  :deep(.modal-full-screen .modal-container:not(.vault-secret-picker .modal-container)) {
    // in figma the modal is 1477px wide, so we set the max-width to 1477px so that when the screen is wider
    // too much space on the sides for the redis partial form can be avoided
    max-width: 1477px;
  }

  :deep(.modal-container .modal-content) {
    padding: 0;
  }

  :deep(.vault-secret-picker .modal-container .modal-content) {
    padding: $kui-space-80;
  }

  :deep(.k-card) {
    border: none;
    border-radius: $kui-border-radius-0;
  }
}

.redis-modal-footer {
  width: 100%;

  :deep(.form-actions) {
    margin: 0
  }
}
</style>
