<template>
  <div class="linked-plugins-modal">
    <KModal
      :action-button-text="t('actions.done')"
      hide-cancel-button
      :title="title"
      :visible="visible"
      @cancel="cancel"
      @proceed="proceed"
    >
      <LinkedPluginList
        :redis-configuration-id="redisConfigurationId"
        @view-plugin="($event) => emit('view-plugin', $event)"
      />
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import composables from '../composables'
import LinkedPluginList from './LinkedPluginList.vue'

defineProps({
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
  (e: 'view-plugin', pluginId: string): void
}>()

const { i18n: { t } } = composables.useI18n()

const title = computed(() => t('linked_plugins_modal.title', { count: 100 }))

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
