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
      :config="redisFormConfig"
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
import { PartialType, RedisConfigurationForm, type KongManagerRedisConfigurationFormConfig, type KonnectRedisConfigurationFormConfig } from '@kong-ui-public/entities-redis-configurations'
// import {
//   getMessageFromError,
// } from '@/helpers/services'
import { ref, nextTick, watch, computed, inject } from 'vue'
import { useRoute } from 'vue-router'
// import type { AxiosError } from 'axios'
import english from '../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import '@kong-ui-public/entities-vaults/dist/style.css'
import '@kong-ui-public/entities-redis-configurations/dist/style.css'
import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

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
const $route = useRoute()
const controlPlaneId = computed((): string => String($route.params.control_plane_id || ''))
const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig = inject(FORMS_CONFIG)!

const redisFormConfig = ref<KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig>(
  formConfig.app === 'konnect'
    ? { ...formConfig, controlPlaneId: controlPlaneId.value }
    : { ...formConfig },
)

const emits = defineEmits<{
  (e: 'partialUpdated'): void
  (e: 'modalClose'): void
}>()

// const { notify } = composables.useToaster()

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
const onError = () => {
  // TODO: global notification in consuming app
  // notify({
  //   message: getMessageFromError(error),
  //   appearance: 'danger',
  // })
}

const onUpdated = () => {
  emits('partialUpdated')
  handleClose()
  // TODO: global notification in consuming app
  // notify({
  //   message: i18n.t('plugins.redis_partial_create_success'),
  //   appearance: 'success',
  // })
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
