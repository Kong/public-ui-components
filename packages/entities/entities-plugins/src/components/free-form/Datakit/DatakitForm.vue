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
        :model-value="realEditorMode"
        :options="editorModes"
        @update:model-value="editorMode = $event"
      >
        <template #option-label="{ option }">
          <KTooltip
            :disabled="flowAvailable || option.value !== 'flow'"
            :text="t('plugins.free-form.datakit.flow_editor.disabled_tooltip')"
          >
            <div class="option-label">
              <component :is="icons[option.value]" />
              {{ option.label }}
            </div>
          </KTooltip>
        </template>
      </KSegmentedControl>
    </template>

    <template #default="formProps">
      <Form
        v-bind="formProps"
        :data="{ config, __ui_data: uiData }"
        tag="div"
        @change="handleFormChange"
      >
        <FlowEditor
          v-if="finalEditorMode === 'flow'"
          :config="config"
          :is-editing="props.isEditing"
          :ui-data="uiData"
          @change="handleFlowChange"
        />
        <CodeEditor
          v-else-if="finalEditorMode === 'code'"
          class="code-editor"
          :config="config"
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
import type { SegmentedControlOption } from '@kong/kongponents'
import type { Component } from 'vue'
// import type { ZodError } from 'zod'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { DatakitConfig, DatakitUIData, EditorMode } from './types'

import { createI18n } from '@kong-ui-public/i18n'
import { CodeblockIcon, DesignIcon } from '@kong/icons'
import { KSegmentedControl } from '@kong/kongponents'
import { computed, inject, ref, watch } from 'vue'

import { FEATURE_FLAGS } from '../../../constants'
import english from '../../../locales/en.json'
import Form from '../shared/Form.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './composables'
import FlowEditor from './flow-editor/FlowEditor.vue'
// import { DatakitConfigSchema } from './schema/strict'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './schema/compat'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props>()

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

const flowAvailable = ref<boolean>(true)

const editorModes = computed<Array<SegmentedControlOption<EditorMode>>>(() => {
  const modes: Array<SegmentedControlOption<EditorMode>> = [
    {
      label: t('plugins.free-form.datakit.flow_editor.mode'),
      value: 'flow',
    },
    {
      label: t('plugins.free-form.datakit.code_editor.mode'),
      value: 'code',
    },
  ]

  modes[0].disabled = !flowAvailable.value
  return modes
})

const realEditorMode = computed<EditorMode>(() => {
  return flowAvailable.value ? editorMode.value : 'code'
})

const description = computed(() => {
  switch (realEditorMode.value) {
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
const uiData = ref<DatakitUIData | undefined>(props.model.__ui_data ? { ...props.model.__ui_data } : undefined)

watch(realEditorMode, () => {
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })
})

/**
 * Handle changes to the config and UI data.
 *
 * @param newConfig The new config to set.
 * @param newUIData The new UI data to set. Use `null` to clear the existing UI data.
 */
function handleConfigChange(newConfig: unknown, newUIData?: DatakitUIData | null) {
  // update the external form state
  props.onFormChange({
    config: newConfig,
    ...newUIData !== undefined ? { __ui_data: newUIData ?? undefined } : null,
  })
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })

  // update the local config as the external form state isn't
  // flowing back down to the component
  config.value = newConfig
}

/**
 * Handle changes from the flow editor.
 *
 * @param newConfig The new config to set.
 * @param newUIData The new UI data to set. Use `null` to clear the existing UI data.
 */
function handleFlowChange(newConfig: DatakitConfig, newUIData?: DatakitUIData | null) {
  handleConfigChange(newConfig, newUIData)

  if (newUIData !== undefined) {
    uiData.value = newUIData ?? undefined
  }
}

// Code editor

// function stringifyPath(path: Array<string | number>): string {
//   return path
//     .map((k) =>
//       typeof k === 'number'
//         ? `[${k}]`
//         : path.length && typeof k === 'string' && k.includes('.')
//           ? `["${k}"]`
//           : `.${k}`,
//     )
//     .join('')
//     .replace(/^\./, '')
// }

// function getSchemaErrorMessage(error: ZodError): string {
//   return error.issues
//     .map(
//       (issue) =>
//         `${stringifyPath(issue.path as Array<string | number>)} - ${
//           issue.message
//         }`,
//     )
//     .join('; ')
// }

function handleCodeChange(newConfig: unknown) {
  handleConfigChange(newConfig)

  // TODO: use strict validation and map back to the exact location of schema validation errors
  // const { success, error } = DatakitConfigSchema.safeParse(newConfig)

  const { success: compatSuccess } = DatakitConfigCompatSchema.safeParse(newConfig)
  flowAvailable.value = compatSuccess

  // props.onValidityChange?.({
  //   model: 'config',
  //   valid: success,
  //   error: success ? '' : getSchemaErrorMessage(error),
  // })
}

function handleCodeError(msg: string) {
  flowAvailable.value = false

  props.onValidityChange?.({
    model: 'config',
    valid: false,
    error: msg,
  })
}

// Flow editor

// This change comes from freeform fields
function handleFormChange(data: any) {
  for (const key in data.config) {
    // updating nodes can lead to re`load`ing the flow editor state
    if (key !== 'nodes') {
      config.value[key] = data.config[key]
    }
  }
}
</script>

<style lang="scss" scoped>
.dk-form {
  .option-label {
    align-items: center;
    display: flex;
    gap: $kui-space-30;
  }
}
</style>
