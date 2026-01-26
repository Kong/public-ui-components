<template>
  <Teleport
    to="#plugin-form-page-actions"
  >
    <KSegmentedControl
      data-testid="datakit-editor-mode-switcher"
      :model-value="layoutEditorMode"
      :options="editorModes"
      @update:model-value="layoutEditorMode = $event"
    />
  </Teleport>

  <StandardLayout
    v-bind="props"
    :editor-mode="layoutEditorMode"
    :on-form-change="handleFormChange"
  >
    <ConfigForm />

    <template #code-editor>
      <YamlEditor
        ref="yaml-editor"
        @source-change="handleCodeChange"
      />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { computed, provide, ref, toRaw, useTemplateRef, watch } from 'vue'
import ConfigForm from './ConfigForm.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import YamlEditor from '../shared/YamlEditor.vue'
import yaml, { JSON_SCHEMA } from 'js-yaml'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { SegmentedControlOption } from '@kong/kongponents'
import { useEventListener } from '@vueuse/core'
import { postKonnectMessage, type PostKonnectMessageData } from './post-konnect-message'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const layoutEditorMode = ref<'form' | 'code'>('form')

const editorModes = computed<Array<SegmentedControlOption<'form' | 'code'>>>(() => {
  const modes: Array<SegmentedControlOption<'form' | 'code'>> = [
    {
      label: 'Visual Editor',
      value: 'form',
    },
    {
      label: 'Code Editor',
      value: 'code',
    },
  ]

  return modes
})

const codeEditorRef = useTemplateRef('yaml-editor')

async function updateCodeContent(newContent: string) {
  if (layoutEditorMode.value !== 'code') {
    layoutEditorMode.value = 'code'

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const yamlEditor = codeEditorRef.value
  if (!yamlEditor) return
  yamlEditor.updateContentWithDiff(newContent)
}

interface MessageToDrWho extends PostKonnectMessageData {
  app: 'dr-who-agent'
  action: 'custom:route-context'
  customPayload: {
    params: {
      // The current plugin name
      plugin: string
      // The current config content (YAML string)
      config: string
    }
    query: Record<string, string>
  }
}

interface MessageFromDrWho extends PostKonnectMessageData {
  app: 'dr-who-agent'
  action: 'custom:update-plugin-config'
  customPayload: {
    params: {
      // The generated config content from KAi
      config: string
    }
    query: Record<string, string>
  }
}

// Handle messages from Dr.Who Agent to update plugin config
useEventListener(window, 'message', (evt: MessageEvent<MessageFromDrWho>) => {

  if (evt.data.app !== 'dr-who-agent') return
  if (evt.data.action !== 'custom:update-plugin-config') return
  console.log('Received message from dr-who:', evt)

  const newConfig = evt.data.customPayload?.params?.config
  if (typeof newConfig !== 'string') return
  updateCodeContent(newConfig)
})

const msgToDrWho = ref<MessageToDrWho>({
  app: 'dr-who-agent',
  action: 'custom:route-context',
  customPayload: {
    params: {
      plugin: props.pluginName,
      config: '',
    },
    query: {},
  },
})

function handleCodeChange(newContent: string) {
  msgToDrWho.value.customPayload.params.config = newContent
}

function handleFormChange(formData: any) {
  if (layoutEditorMode.value === 'code') return
  const yamlString = yaml.dump(toRaw(formData), {
    schema: JSON_SCHEMA,
    noArrayIndent: true,
  })
  handleCodeChange(yamlString)
}

// Send message to Dr.Who
watch(() => msgToDrWho.value, (newMessage) => {
  try {
    console.log('Posting message to dr-who:', newMessage)
    postKonnectMessage(toRaw(newMessage))
  } catch (e) {
    console.error('Failed to log message to dr-who:', e)
  }
}, { deep: true, immediate: true })
</script>
