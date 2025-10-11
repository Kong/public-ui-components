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
        tag="div"
      >
        <FlowEditor
          v-if="realEditorMode === 'flow'"
          :is-editing="props.isEditing"
          @change="handleFlowChange"
        />
        <CodeEditor
          v-else-if="realEditorMode === 'code'"
          class="code-editor"
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
import type { EditorMode } from './types'

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
import {
  DatakitConfigSchema as DatakitConfigCompatSchema,
  DatakitConfigSchemaM2 as DatakitConfigCompatSchemaM2,
} from './schema/compat'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props>()

// provided by consumer apps
const enableFlowEditor = inject<boolean>(FEATURE_FLAGS.DATAKIT_ENABLE_FLOW_EDITOR, false)
const enableDatakitM2 = inject<boolean>(FEATURE_FLAGS.DATAKIT_M2, false)

// Editor mode selection

const { editorMode } = usePreferences()
const realEditorMode = computed<EditorMode>(() => {
  return (enableFlowEditor && flowAvailable.value) ? editorMode.value : 'code'
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
 * @param newUIData The new UI data to set.
 */
function handleConfigChange() {
  props.onValidityChange?.({
    model: 'config',
    valid: true,
  })
}

/**
 * Handle changes from the flow editor.
 *
 * @param newConfig The new config to set.
 * @param newUIData The new UI data to set.
 */
function handleFlowChange() {
  handleConfigChange()
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
  handleConfigChange()

  // TODO: use strict validation and map back to the exact location of schema validation errors
  // const { success, error } = DatakitConfigSchema.safeParse(newConfig)

  const schema = enableDatakitM2
    ? DatakitConfigCompatSchemaM2
    : DatakitConfigCompatSchema

  const { success: compatSuccess } = schema.safeParse(newConfig)
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
