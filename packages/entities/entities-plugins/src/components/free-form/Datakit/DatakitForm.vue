<template>
  <StandardLayout
    v-bind="props"
    class="dk-form"
  >
    <template
      v-if="enableVisualEditor"
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
      <div v-if="finalEditorMode === 'visual'">
        <KButton
          appearance="secondary"
          @click="modalOpen = true"
        >
          {{ t('plugins.free-form.datakit.visual_editor.cta') }}
        </KButton>
        <EditorModal v-model:open="modalOpen" />
      </div>

      <Form
        v-else-if="finalEditorMode === 'code'"
        v-bind="formProps"
        tag="div"
      >
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
          class="editor"
          :config="props.model.config"
          :editing="props.isEditing"
          @change="handleCodeChange"
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
import { computed, ref, useTemplateRef, inject, type Component } from 'vue'
import { KAlert, KSegmentedControl } from '@kong/kongponents'
import { SparklesIcon, DesignIcon, CodeblockIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import Form from '../shared/Form.vue'
import EditorModal from './visual-editor/modal/EditorModal.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './visual-editor/composables'
import * as examples from './examples'

import type { SegmentedControlOption } from '@kong/kongponents'
import type { Props } from '../shared/layout/StandardLayout.vue'
import type { EditorMode } from './visual-editor/types'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<any>>()

// provided by consumer apps
// TODO: make the default value to `false` to make it opt-in
// It's currently set to `true` for testing purposes
const enableVisualEditor = inject<boolean>('DATAKIT_ENABLE_VISUAL_EDITOR', true)

// Editor mode selection

const { editorMode } = usePreferences()
const finalEditorMode = computed<EditorMode>(() => {
  return enableVisualEditor ? editorMode.value : 'code'
})

const icons: Record<EditorMode, Component> = {
  visual: DesignIcon,
  code: CodeblockIcon,
}

const editorModes = [
  {
    label: t('plugins.free-form.datakit.visual_editor.mode'),
    value: 'visual',
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
    case 'visual':
      return t('plugins.free-form.datakit.description_visual')
    default:
      return ''
  }
})

// Visual editor

const modalOpen = ref(false)

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
  .editor {
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
