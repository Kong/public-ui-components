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

        <div class="settings">
          <BooleanField
            :label="t('plugins.free-form.datakit.flow_editor.debug.label')"
            :label-attributes="{
              info: t('plugins.free-form.datakit.flow_editor.debug.description'),
              tooltipAttributes,
            }"
            name="config.debug"
          />
        </div>

        <div class="divider" />

        <KDropdown
          appearance="tertiary"
          :kpop-attributes="{
            placement: 'bottom-end',
            target: 'body',
          }"
          show-caret
          :trigger-text="t('plugins.free-form.datakit.flow_editor.examples')"
          :width="240"
        >
          <template #items>
            <KDropdownItem
              v-for="(example, key) in examples"
              :key="key"
              @click="selectExample(example)"
            >
              {{ t(`plugins.free-form.datakit.examples.${key}`) }}
            </KDropdownItem>
          </template>
        </KDropdown>

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
      <FlowPanels
        mode="edit"
        resizable
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ExternalLinkIcon, RedoIcon, UndoIcon } from '@kong/icons'
import { KButton, KDropdown, KTooltip, KDropdownItem } from '@kong/kongponents'
import yaml, { JSON_SCHEMA } from 'js-yaml'

import english from '../../../../../locales/en.json'
import BooleanField from '../../../shared/BooleanField.vue'
import { HOTKEYS } from '../constants'
import examples from '../../examples'
import { useHotkeys } from '../composables/useHotkeys'
import FlowPanels from '../FlowPanels.vue'
import HotkeyLabel from '../HotkeyLabel.vue'
import { useEditorStore } from '../store/store'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import type { TooltipAttributes } from '@kong/kongponents'
import type { DatakitConfig, DatakitPluginData } from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

defineSlots<{
  default(): any
}>()

const { modalOpen, undo, redo, canUndo, canRedo, load } = useEditorStore()

function selectExample(example: string) {
  const maybeConfig = yaml.load(example, {
    schema: JSON_SCHEMA,
    json: true,
  })

  if (typeof maybeConfig !== 'object' || maybeConfig === null)
    return

  const partialConfig = maybeConfig as Partial<DatakitConfig>
  // todo(zehao): the scope of example should be expanded to include `partials`
  const pluginData: DatakitPluginData = {
    config: {
      ...partialConfig,
      nodes: partialConfig.nodes ?? [],
    },
  }

  load(pluginData, true)
}

function close() {
  modalOpen.value = false
}

useHotkeys({
  enabled: modalOpen,
  undo,
  redo,
})

const tooltipAttributes = {
  maxWidth: '300px',
  // @ts-ignore-next-line Kongponents hasn't exposed zIndex in the type yet
  zIndex: 10000,
} satisfies TooltipAttributes
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

  .settings {
    align-items: center;
    display: flex;
    padding: 0 $kui-space-40;
  }

  .divider {
    border-right: $kui-border-width-10 solid $kui-color-border;
  }
}
</style>
