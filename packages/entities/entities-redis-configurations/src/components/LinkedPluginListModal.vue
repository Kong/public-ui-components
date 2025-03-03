<template>
  <div
    class="linked-plugins-modal"
    data-testid="linked-plugins-modal"
  >
    <KModal
      :action-button-text="t('actions.done')"
      hide-cancel-button
      :title="title"
      :visible="visible"
      @cancel="cancel"
      @proceed="proceed"
    >
      <LinkedPluginList
        :config="config"
        :partial-id="redisConfigurationId"
        @load="({ total }) => count = total"
        @view-plugin="($event) => emit('view-plugin', $event)"
      />
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue'

import composables from '../composables'
import LinkedPluginList from './LinkedPluginList.vue'
import {
  type KongManagerConfig,
  type KonnectConfig,
  AppType,
} from '@kong-ui-public/entities-shared'

defineProps({
  config: {
    type: Object as PropType<KonnectConfig | KongManagerConfig>,
    required: true,
    validator: (config: KonnectConfig | KongManagerConfig) => {
      if (!config || ![AppType.Konnect, AppType.KongManager].includes(config?.app)) return false
      if (config.app === AppType.Konnect && !config.controlPlaneId) return false
      if (config.app === AppType.KongManager && typeof config.workspace !== 'string') return false
      return true
    },
  },
  redisConfigurationId: {
    type: String,
    required: true,
  },
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'proceed'): void
  (e: 'view-plugin', param: { id: string, plugin: string }): void
}>()

const { i18n: { t } } = composables.useI18n()

const count = ref(0)
const title = computed(() => t('linked_plugins_modal.title', { count: count.value }))

const cancel = () => {
  emit('cancel')
}

const proceed = () => {
  emit('proceed')
}
</script>

<style scoped lang="scss">
.linked-plugins-modal {
  :deep(.k-table-view) {
    background-color: transparent;
  }

  :deep(.modal-container) {
    min-width: 640px;
  }
}

@media (max-width: $kui-breakpoint-mobile) {
  .linked-plugins-modal {
    :deep(.modal-container) {
      min-width: 100%;
    }
  }
}
</style>
