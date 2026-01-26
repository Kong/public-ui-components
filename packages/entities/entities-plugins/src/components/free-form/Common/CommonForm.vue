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
  >
    <ConfigForm />

    <template #code-editor>
      <YamlEditor />
    </template>
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { computed, provide, ref } from 'vue'
import ConfigForm from './ConfigForm.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import YamlEditor from '../shared/YamlEditor.vue'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { SegmentedControlOption } from '@kong/kongponents'

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
</script>
