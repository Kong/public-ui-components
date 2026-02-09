<template>
  <!-- Editor Mode Switcher -->
  <Teleport
    v-if="enableCodeMode"
    to="#plugin-form-page-actions"
  >
    <KSegmentedControl
      data-testid="plugin-editor-mode-switcher"
      :model-value="editorMode"
      :options="editorModeOptions"
      @update:model-value="handleEditorModeChange"
    />
  </Teleport>

  <StandardLayout
    v-bind="props"
    :editor-mode="editorMode"
  >
    <ConfigForm />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { inject, provide, ref } from 'vue'
import ConfigForm from './ConfigForm.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { Props as StandardLayoutProps } from '../shared/layout/StandardLayout.vue'
import type { SegmentedControlOption } from '@kong/kongponents'
import { FEATURE_FLAGS } from '../../../constants'
import composables from '../../../composables'
import { useLocalStorage } from '@vueuse/core'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const enableCodeMode = inject<boolean>(FEATURE_FLAGS.KM_2262_CODE_MODE, false)

const { i18n: { t } } = composables.useI18n()

const editorModePreference = useLocalStorage<StandardLayoutProps['editorMode']>('plugin-editor-mode', 'form')

const editorMode = ref<StandardLayoutProps['editorMode']>(
  enableCodeMode ? editorModePreference.value : 'form', // Force 'form' mode if code mode is not enabled
)

const editorModeOptions: Array<SegmentedControlOption<NonNullable<StandardLayoutProps['editorMode']>>> = [
  {
    label: t('plugins.free-form.editor_mode.visual'),
    value: 'form',
  },
  {
    label: t('plugins.free-form.editor_mode.code'),
    value: 'code',
  },
]

function handleEditorModeChange(newMode: StandardLayoutProps['editorMode']) {
  editorMode.value = newMode
  editorModePreference.value = newMode
}
</script>
