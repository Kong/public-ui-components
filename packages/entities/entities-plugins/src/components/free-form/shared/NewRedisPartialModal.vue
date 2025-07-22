<template>
  <KModal
    class="plugin-redis-partial-form"
    data-testid="redis-partial-form-modal"
    full-screen
    :title="t('plugins.free-form.redis_partial.redis_partial_modal_title')"
    :visible="modalVisible"
    @cancel="handleClose"
  >
    <RedisConfigurationForm
      :action-teleport-target="modalActionTeleportTarget"
      :config="formConfig"
      :disabled-partial-type="disabledPartialType"
      :slidout-top-offset="0"
      @cancel="handleClose"
      @error="onError"
      @update="onUpdated"
    />
    <template #footer>
      <div id="km-modal-footer" />
    </template>
  </KModal>
</template>

<script setup lang="ts">
import { PartialType, RedisConfigurationForm } from '@kong-ui-public/entities-redis-configurations'
import { ref, nextTick, watch, computed, inject } from 'vue'
import type { AxiosError } from 'axios'
import english from '../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import '@kong-ui-public/entities-vaults/dist/style.css'
import '@kong-ui-public/entities-redis-configurations/dist/style.css'
import { useErrors, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { PartialNotification } from './types'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  partialType: {
    type: String,
    default: '',
  },
})

const { t } = createI18n<typeof english>('en-us', english)
const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig = inject(FORMS_CONFIG)!

const emits = defineEmits<{
  (e: 'partialUpdated', payload: PartialNotification): void
  (e: 'partialUpdateFailed', payload: PartialNotification): void
  (e: 'modalClose'): void
}>()

const { getMessageFromError } = useErrors()

const disabledPartialType = computed(() => {
  switch (props.partialType) {
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
  emits('partialUpdateFailed', {
    message: getMessageFromError(error),
    appearance: 'danger',
  })
}

const onUpdated = () => {
  emits('partialUpdated', {
    message: t('plugins.free-form.redis_partial.partial_created_success_message'),
    appearance: 'success',
  })
  handleClose()
}

const handleClose = () => {
  modalActionTeleportTarget.value = undefined
  emits('modalClose')
  nextTick(() => {
    modalVisible.value = false
  })
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      modalVisible.value = true
      nextTick(() => {
        modalActionTeleportTarget.value = '#km-modal-footer'
      })
    }
  },
)
</script>

<style scoped lang="scss">
.plugin-redis-partial-form {
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

#km-modal-footer {
  width: 100%;
}
</style>
