<template>
  <Teleport
    v-if="enableDatakitM2"
    :disabled="!hasTeleportTarget"
    to="#plugin-form-page-actions"
  >
    <KSegmentedControl
      data-testid="datakit-editor-mode-switcher"
      :model-value="realEditorMode"
      :options="editorModes"
      @update:model-value="editorMode = $event"
    >
      <template #option-label="{ option }">
        <KTooltip
          :disabled="flowAvailable || option.value !== 'flow'"
          :text="t('plugins.free-form.datakit.flow_editor.disabled_tooltip')"
        >
          <div class="dk-option-label">
            <component :is="icons[option.value]" />
            {{ option.label }}
          </div>
        </KTooltip>
      </template>
    </KSegmentedControl>
  </Teleport>

  <StandardLayout
    v-bind="props"
    class="dk-form"
    :editor-mode="layoutEditorMode"
  >
    <template
      v-if="enableFlowEditor && !enableDatakitM2"
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
            <div class="dk-option-label">
              <component :is="icons[option.value]" />
              {{ option.label }}
            </div>
          </KTooltip>
        </template>
      </KSegmentedControl>
    </template>

    <FlowEditor
      v-if="realEditorMode === 'flow'"
      :is-editing="props.isEditing"
      @change="handleFlowChange"
    />
    <CodeEditor
      v-else-if="realEditorMode === 'code' && !enableDatakitM2"
      class="code-editor"
      :editing="props.isEditing"
      @change="handleCodeChange"
      @error="handleCodeError"
    />

    <template #code-editor>
      <CodeEditor
        class="code-editor"
        :editing="props.isEditing"
        @change="handleCodeChange"
        @error="handleCodeError"
      />
    </template>

    <template #plugin-config-title>
      {{ configTitle }}
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
import type { DatakitConfig, EditorMode, DatakitPluginData } from './types'

import { createI18n } from '@kong-ui-public/i18n'
import { CodeblockIcon, DesignIcon } from '@kong/icons'
import { KSegmentedControl } from '@kong/kongponents'
import { computed, inject, onMounted, ref, watch } from 'vue'

import { FEATURE_FLAGS } from '../../../constants'
import english from '../../../locales/en.json'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import CodeEditor from './CodeEditor.vue'
import { usePreferences } from './composables'
import FlowEditor from './flow-editor/FlowEditor.vue'
// import { DatakitConfigSchema } from './schema/strict'
import {
  DatakitConfigSchema as DatakitConfigCompatSchema,
} from './schema/compat'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<DatakitPluginData>>()

// provided by consumer apps
const enableFlowEditor = inject<boolean>(FEATURE_FLAGS.DATAKIT_ENABLE_FLOW_EDITOR, false)
const enableDatakitM2 = inject<boolean>(FEATURE_FLAGS.DATAKIT_M2, false)

// Check if the teleport target exists
const hasTeleportTarget = ref(false)
onMounted(() => {
  hasTeleportTarget.value = !!document.querySelector('#plugin-form-page-actions')
})

// Editor mode selection

const { editorMode } = usePreferences()
const realEditorMode = computed<EditorMode>(() => {
  return (enableFlowEditor && flowAvailable.value) ? editorMode.value : 'code'
})
const layoutEditorMode = computed<'form' | 'code'>(() => {
  if (!enableDatakitM2) {
    return 'form'
  }
  return realEditorMode.value === 'flow' ? 'form' : 'code'
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

const configTitle = computed(() => {
  if (enableDatakitM2) {
    return t('plugins.free-form.datakit.plugin_config.title')
  }
  return t('plugins.form.sections.plugin_config.title')
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

  let uncheckedConfig: unknown = newConfig

  // TODO: use strict validation and map back to the exact location of schema validation errors
  // const { success, error } = DatakitConfigSchema.safeParse(uncheckedConfig)

  if (enableDatakitM2) {
    uncheckedConfig = (newConfig as DatakitPluginData)?.config
  }

  const { success: compatSuccess } = DatakitConfigCompatSchema.safeParse(uncheckedConfig)
  let isValid = compatSuccess

  if (!enableDatakitM2 && isValid) {
    isValid = !isM2FeatureUsed(newConfig as DatakitConfig | undefined)
  }

  flowAvailable.value = isValid

  // props.onValidityChange?.({
  //   model: 'config',
  //   valid: success,
  //   error: success ? '' : getSchemaErrorMessage(error),
  // })
}

/**
 * Check if there are some M2 features existed, they are not supported in the UI yet
 */
function isM2FeatureUsed(config: DatakitConfig | undefined): boolean {
  // check vault resource
  if (config?.resources?.vault) return true

  // check branch or cache nodes
  const hasBranchOrCacheNode = config?.nodes?.some((node) => {
    return node.type === 'branch' || node.type === 'cache'
  })
  if (hasBranchOrCacheNode) return true

  return false
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
.dk-option-label {
  align-items: center;
  display: flex;
  gap: $kui-space-30;
}
</style>
