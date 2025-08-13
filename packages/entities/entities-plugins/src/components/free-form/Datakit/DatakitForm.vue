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
            :config="props.model.config"
            :editing="props.isEditing"
          />
        </div>

        <div v-else-if="finalEditorMode === 'code'">
          <KAlert class="examples">
            <div class="examples-content">
              {{ t('plugins.free-form.datakit.description_example') }}

              <KButton
                v-for="(_, key) in examples"
                :key="key"
                appearance="secondary"
                size="small"
                @click="handleExampleClick(key)"
              >
                {{ t(`plugins.free-form.datakit.examples.${key}`) }}
              </KButton>
            </div>

            <template #icon>
              <SparklesIcon />
            </template>
          </KAlert>

          <CodeEditor
            ref="code-editor"
            class="code-editor"
            :config="props.model.config"
            :editing="props.isEditing"
            @change="handleCodeChange"
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
import { computed, useTemplateRef, inject } from 'vue'
import { KAlert, KSegmentedControl } from '@kong/kongponents'
import { SparklesIcon, DesignIcon, CodeblockIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import Form from '../shared/Form.vue'
import FlowEditor from './flow-editor/FlowEditor.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './composables'
import * as examples from './examples'
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

// Code editor

const codeEditor = useTemplateRef('code-editor')

function handleExampleClick(example: keyof typeof examples) {
  codeEditor.value?.setExampleCode(example)
}

function handleCodeChange(config: any) {
  props.onFormChange({
    config,
  })
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })
}

function handleCodeError(msg: string) {
  props.onValidityChange?.({
    model: 'config',
    valid: false,
    error: msg,
  })
}
</script>

<style lang="scss" scoped>
.dk-form {
  .code-editor {
    height: 684px;
  }

  .examples {
    margin-bottom: $kui-space-70;
  }

  .examples-content {
    display: flex;
    gap: $kui-space-40;
  }
}
</style>
