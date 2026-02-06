<template>
  <Teleport to="body">
    <KPrompt
      :action-button-text="i18n.t('routerPlaygroundModal.actionButton')"
      class="router-playground-modal"
      text-align="left"
      :title="i18n.t('routerPlaygroundModal.title')"
      :visible="isVisible"
      @cancel="emit('cancel')"
      @proceed="emit('commit', expression)"
    >
      <template #default>
        <RouterPlayground
          v-bind="props"
          hide-editor-actions
          hide-title
          @change="exp => expression = exp"
          @notify="emit('notify', $event)"
        />
      </template>
    </KPrompt>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type {
  Props as RouterPlaygroudProps,
  Emits as RouterPlaygroudEmits,
} from './RouterPlayground.vue'
import RouterPlayground from './RouterPlayground.vue'
import composeables from '../composables'

const { i18n } = composeables.useI18n()

const props = defineProps<{
  isVisible: boolean
} & RouterPlaygroudProps>()

const emit = defineEmits<{
  cancel: []
} & RouterPlaygroudEmits>()

const expression = ref('')
</script>

<style lang="scss">
.router-playground-modal {
  .k-modal-backdrop {
    overflow-y: scroll;
  }

  .modal-container {
    max-width: 1280px !important;
    width: 100% !important;
  }

  .k-modal-header {
    margin-bottom: var(--kui-space-0, $kui-space-0) !important;
  }

  .k-prompt-header hr {
    margin-bottom: var(--kui-space-0, $kui-space-0);
    margin-top: var(--kui-space-50, $kui-space-50);
  }

  .k-prompt-body hr {
    margin-bottom: var(--kui-space-0, $kui-space-0);
    margin-top: var(--kui-space-0, $kui-space-0);
  }

  .k-prompt-body-content {
    max-height: 800px !important;
    padding: var(--kui-space-80, $kui-space-80) var(--kui-space-0, $kui-space-0);
  }
}
</style>
