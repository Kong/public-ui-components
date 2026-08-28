<template>
  <TeleportWithFallback
    v-if="formConfig.app === 'konnect'"
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
        >
          <template #content>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="flowDisabledTooltip" />
          </template>
          <div class="dk-option-label">
            <component :is="icons[option.value]" />
            {{ option.label }}
          </div>
        </KTooltip>
      </template>
    </KSegmentedControl>
  </TeleportWithFallback>

  <DynamicLayout
    v-bind="{ ...attrs, ...props }"
    class="dk-form"
    :config-sections="configSections"
    :editor-mode="layoutEditorMode"
    hide-editor-mode-switcher
  >
    <template #section-plugin-config>
      <FlowEditor
        v-if="realEditorMode === 'flow'"
        :is-editing="props.isEditing"
        @change="handleFlowChange"
      />
    </template>

    <template
      v-if="enableCaCertificates"
      #section-advanced
    >
      <KCollapse
        v-model="advancedCollapsed"
        data-testid="dk-advanced-configuration-collapse"
        :trigger-label="advancedCollapsed
          ? t('plugins.free-form.datakit.advanced_configuration.show_label')
          : t('plugins.free-form.datakit.advanced_configuration.hide_label')"
      >
        <CaCertificatesField name="$.config.ca_certificates" />
      </KCollapse>
    </template>

    <template #code-editor>
      <CodeEditor
        class="code-editor"
        :editing="props.isEditing"
        @change="handleCodeChange"
        @error="handleCodeError"
      />
    </template>
  </DynamicLayout>
</template>

<script setup lang="ts">
import type { SegmentedControlOption } from '@kong/kongponents'
import type { Component } from 'vue'
import type { ZodError } from 'zod'

import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { ConfigSection } from '../../shared/types'
import type { EditorMode, DatakitPluginData } from './types'

import { computed, inject, ref, watch, useAttrs } from 'vue'
import { escape } from 'lodash-es'
import { createI18n } from '@kong-ui-public/i18n'
import { CodeblockIcon, DesignIcon } from '@kong/icons'
import { KCollapse, KSegmentedControl, KTooltip } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../../../types'

import english from '../../../../locales/en.json'
import { FEATURE_FLAGS } from '../../../../constants'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'
import CaCertificatesField from './CaCertificatesField.vue'
import CodeEditor from './CodeEditor.vue'
import TeleportWithFallback from './TeleportWithFallback.vue'
import { usePreferences } from './composables'
import FlowEditor from './flow-editor/FlowEditor.vue'
// import { DatakitConfigSchema } from './schema/strict'
import {
  DatakitConfigSchema as DatakitConfigCompatSchema,
} from './schema/compat'

defineOptions({ inheritAttrs: false })

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<DatakitPluginData>>()
const attrs = useAttrs()

// provided by consumer apps
const formConfig = inject<KonnectPluginFormConfig | KongManagerPluginFormConfig>(FORMS_CONFIG)!

// Editor mode selection

const { editorMode } = usePreferences()
const realEditorMode = computed<EditorMode>(() => {
  // Disable flow editor for non-Konnect apps or if flow is not available due to incompatible config
  if (formConfig.app !== 'konnect' || flowAvailable.value === false) {
    return 'code'
  }

  return editorMode.value
})
const layoutEditorMode = computed<'form' | 'code'>(() => {
  if (formConfig.app === 'kongManager') {
    return 'code'
  }
  return realEditorMode.value === 'flow' ? 'form' : 'code'
})


const icons: Record<EditorMode, Component> = {
  flow: DesignIcon,
  code: CodeblockIcon,
}

const flowAvailable = ref<boolean>(true)
const flowUnavailableReason = ref<string>('')

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

// Advanced configuration section (ca_certificates), gated behind KM-3034-features-316.
const enableCaCertificates = inject<boolean>(FEATURE_FLAGS.KM_3034_FEATURES_316, false)

const advancedCollapsed = ref(!(props.isEditing && !!props.model?.config?.ca_certificates?.length))

const configSections = computed<ConfigSection[]>(() => {
  const sections: ConfigSection[] = [
    {
      name: 'plugin-config',
      title: t('plugins.free-form.datakit.flow_editor.mode'),
      description: t('plugins.free-form.datakit.description_flow'),
    },
  ]

  if (enableCaCertificates) {
    sections.push({
      name: 'advanced',
      title: t('plugins.free-form.datakit.advanced_configuration.title'),
    })
  }

  return sections
})

const flowDisabledTooltip = computed(() => {
  if (flowAvailable.value) return ''
  return t('plugins.free-form.datakit.flow_editor.disabled_tooltip', {
    reason: flowUnavailableReason.value,
    // @ts-ignore MessageFormatPrimitiveValue should have function type
    code: (chunks: string) => `<code>${escape(chunks)}</code>`,
  })
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

function stringifyPath(path: Array<string | number>): string {
  return path
    .map((k) =>
      typeof k === 'number'
        ? `[${k}]`
        : path.length && typeof k === 'string' && k.includes('.')
          ? `["${k}"]`
          : `.${k}`,
    )
    .join('')
    .replace(/^\./, '')
}

function getSchemaErrorMessage(error: ZodError): string {
  return error.issues
    .map(
      (issue) =>
        `${stringifyPath(issue.path as Array<string | number>)} - ${
          issue.message
        }`,
    )
    .join('; ')
}

function handleCodeChange(newConfig: unknown) {
  handleConfigChange()

  if (formConfig.app !== 'konnect') {
    return
  }

  const uncheckedConfig = (newConfig as DatakitPluginData)?.config

  // TODO: use strict validation and map back to the exact location of schema validation errors
  // const { success, error } = DatakitConfigSchema.safeParse(uncheckedConfig)

  const { success: compatSuccess, error: compatError } = DatakitConfigCompatSchema.safeParse(uncheckedConfig)
  flowUnavailableReason.value = compatSuccess || !compatError ? '' : getSchemaErrorMessage(compatError)
  flowAvailable.value = compatSuccess

  // props.onValidityChange?.({
  //   model: 'config',
  //   valid: success,
  //   error: success ? '' : getSchemaErrorMessage(error),
  // })
}

function handleCodeError(msg: string) {
  flowUnavailableReason.value = msg
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
  gap: var(--kui-space-30, $kui-space-30);
}
</style>
