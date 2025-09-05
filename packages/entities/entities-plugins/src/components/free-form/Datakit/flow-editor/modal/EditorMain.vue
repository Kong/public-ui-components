<template>
  <div class="dk-editor-main">
    <header class="header">
      <div class="actions">
        <KTooltip
          :z-index="10000"
        >
          <KButton
            appearance="tertiary"
            :disabled="!canUndo"
            icon
            @click="undo"
          >
            <UndoIcon />
          </KButton>

          <template #content>
            <HotkeyLabel
              :keys="HOTKEYS.undo"
              :label="t('plugins.free-form.datakit.flow_editor.actions.undo')"
              reverse
            />
          </template>
        </KTooltip>
        <KTooltip
          :z-index="10000"
        >
          <KButton
            appearance="tertiary"
            :disabled="!canRedo"
            icon
            @click="redo"
          >
            <RedoIcon />
          </KButton>

          <template #content>
            <HotkeyLabel
              :keys="HOTKEYS.redo"
              :label="t('plugins.free-form.datakit.flow_editor.actions.redo')"
              reverse
            />
          </template>
        </KTooltip>
        <div class="divider" />
        <KButton
          appearance="tertiary"
          target="_blank"
          to="https://developer.konghq.com/plugins/datakit/"
        >
          {{ t('plugins.free-form.datakit.flow_editor.actions.view_docs') }}
          <ExternalLinkIcon />
        </KButton>
        <KButton @click="close">
          {{ t('plugins.free-form.datakit.flow_editor.actions.done') }}
        </KButton>
      </div>
    </header>

    <div
      ref="canvasContainer"
      class="body"
    >
      <FlowPanels resizable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ExternalLinkIcon, UndoIcon, RedoIcon } from '@kong/icons'
import { KButton } from '@kong/kongponents'

import english from '../../../../../locales/en.json'
import FlowPanels from '../FlowPanels.vue'
import { useEditorStore } from '../store/store'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useHotkeys } from '../composables/useHotkeys'
import HotkeyLabel from '../HotkeyLabel.vue'
import { HOTKEYS } from '../../constants'

const { t } = createI18n<typeof english>('en-us', english)

defineSlots<{
  default(): any
}>()

const { modalOpen, undo, redo, canUndo, canRedo } = useEditorStore()

function close() {
  modalOpen.value = false
}

useHotkeys({
  enabled: modalOpen,
  undo,
  redo,
})
</script>

<style lang="scss" scoped>
.dk-editor-main {
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    align-items: center;
    border-bottom: 1px solid $kui-color-border;
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    justify-content: flex-end;
    padding: 0px $kui-space-30 0px $kui-space-50;
  }

  .actions {
    display: flex;
    gap: $kui-space-30;
  }

  .body {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .divider {
    border-right: $kui-border-width-10 solid $kui-color-border;
  }

  .flip {
    transform: scaleX(-1); // TODO: remove this after switching to `UndoIcon`
  }
}
</style>
