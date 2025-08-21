<template>
  <StandardLayout
    v-bind="props"
    class="dk-form"
  >
    <template
      v-if="enableFlowEditor"
      #plugin-config-extra
    >
      <KSegmentedControl
        v-model="editorMode"
        :options="editorModes"
      >
        <template #option-label="{ option }">
          <component :is="icons[option.value]" />
          {{ option.label }}
        </template>
      </KSegmentedControl>
    </template>

    <template #default="formProps">
      <Form
        v-bind="formProps"
        :data="{ config }"
        tag="div"
        @change="handleFormChange"
      >
        <FlowEditor
          v-if="finalEditorMode === 'flow'"
          :config="config"
          :is-editing="isEditing"
          :ui-data="uiData"
          @change="handleFlowConfigChange"
        />
        <CodeEditor
          v-else-if="finalEditorMode === 'code'"
          class="code-editor"
          :config="config"
          :editing="isEditing"
          @change="handleConfigChange"
          @error="handleCodeError"
        />
      </Form>
    </template>

    <template #plugin-config-description>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="description" />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import type { SegmentedControlOption } from '@kong/kongponents'
import type { Component } from 'vue'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { DatakitConfig, DatakitUIData, EditorMode } from './types'

import { createI18n } from '@kong-ui-public/i18n'
import { CodeblockIcon, DesignIcon } from '@kong/icons'
import { KSegmentedControl } from '@kong/kongponents'
import { computed, inject, ref } from 'vue'

import { FEATURE_FLAGS } from '../../../constants'
import english from '../../../locales/en.json'
import Form from '../shared/Form.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './composables'
import FlowEditor from './flow-editor/FlowEditor.vue'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

// provided by consumer apps
const enableFlowEditor = inject<boolean>(FEATURE_FLAGS.DATAKIT_ENABLE_FLOW_EDITOR, false)

// Editor mode selection

const { editorMode } = usePreferences()
const finalEditorMode = computed<EditorMode>(() => {
  return enableFlowEditor ? editorMode.value : 'code'
})

const icons: Record<EditorMode, Component> = {
  flow: DesignIcon,
  code: CodeblockIcon,
}

const editorModes = [
  {
    label: t('plugins.free-form.datakit.flow_editor.mode'),
    value: 'flow',
  },
  {
    label: t('plugins.free-form.datakit.code_editor.mode'),
    value: 'code',
  },
] as const satisfies Array<SegmentedControlOption<EditorMode>>

const description = computed(() => {
  switch (editorMode.value) {
    case 'code':
      return t('plugins.free-form.datakit.description_code')
    case 'flow':
      return t('plugins.free-form.datakit.description_flow')
    default:
      return ''
  }
})

// Shared

const config = ref({ ...props.model.config })
const uiData = ref<DatakitUIData>()

// This change comes from freeform fields
function handleFormChange(data: any) {
  for (const key in data.config) {
    // updating nodes can lead to re`load`ing the flow editor state
    if (key !== 'nodes') {
      config.value[key] = data.config[key]
    }
  }
}

function handleConfigChange(newConfig: unknown) {
  // update the external form state
  props.onFormChange({
    config: newConfig,
  })
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })

  // update the local config as the external form state isn't
  // flowing back down to the component
  config.value = newConfig
}

function handleFlowConfigChange(newConfig: DatakitConfig, newUIData?: DatakitUIData) {
  handleConfigChange(newConfig)
  uiData.value = newUIData
}

// Code editor

function handleCodeError(msg: string) {
  props.onValidityChange?.({
    model: 'config',
    valid: false,
    error: msg,
  })
}
</script>
