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
        tag="div"
      >
        <div v-if="finalEditorMode === 'flow'">
          <FlowEditor
            :config="config"
            :editing="props.isEditing"
            @change="handleConfigChange"
          />
        </div>

        <div v-else-if="finalEditorMode === 'code'">
          <CodeEditor
            class="code-editor"
            :config="config"
            :editing="props.isEditing"
            @change="handleConfigChange"
            @error="handleCodeError"
          />
        </div>
      </Form>
    </template>

    <template #plugin-config-description>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="description" />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { KSegmentedControl } from '@kong/kongponents'
import { DesignIcon, CodeblockIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import Form from '../shared/Form.vue'
import FlowEditor from './flow-editor/FlowEditor.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './composables'
import { FEATURE_FLAGS } from '../../../constants'

import type { Component } from 'vue'
import type { SegmentedControlOption } from '@kong/kongponents'
import type { Props } from '../shared/layout/StandardLayout.vue'
import type { EditorMode } from './types'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

// provided by consumer apps
// TODO: make the default value to `false` to make it opt-in
// It's currently set to `true` for testing purposes
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

const config = ref(props.model.config)

function handleConfigChange(newConfig: unknown) {
  config.value = newConfig

  props.onFormChange({
    config: newConfig,
  })
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })
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
