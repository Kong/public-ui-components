<template>
  <div
    v-if="open"
    class="dk-editor-modal"
  >
    <EditorNav
      class="nav"
      @back="close"
    />
    <EditorContent
      ref="content"
      class="content"
      tabindex="0"
    />
    <ConflictModal ref="confirm-modal" />
  </div>
</template>

<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
import { ref, useTemplateRef, watch } from 'vue'
import { DK_HEADER_HEIGHT, DK_SIDE_PANEL_WIDTH } from '../constants'
import ConflictModal from './ConflictModal.vue'

import EditorNav from './EditorNav.vue'
import EditorContent from './EditorContent.vue'
import { provideConfirmModal } from '../composables/useConflictConfirm'
import { useEditorStore } from '../store/store'

import type { OpenConfirm } from './ConflictModal.vue'

const open = defineModel<boolean>('open')
const showConfirm = ref(false)
const confirmModalRef = useTemplateRef('confirm-modal')
const { clear } = useEditorStore()

provideConfirmModal(async (...args: Parameters<OpenConfirm>) => {
  showConfirm.value = true
  const isConfirmed = await confirmModalRef.value!.open(...args)
  showConfirm.value = false
  return isConfirmed
})

const isLocked = useScrollLock(document)

watch(open, (open) => {
  isLocked.value = !!open

  // Clear the history when the editor is closed
  if (!open) {
    clear()
  }
}, { immediate: true })

function close() {
  open.value = false
}
</script>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
.dk-editor-modal {
  background-color: $kui-color-background-inverse;
  display: flex;
  height: 100%;
  left: 0;
  padding-top: $kui-space-40;
  position: fixed;
  scrollbar-width: thin;
  top: 0;
  width: 100%;
  z-index: 1000;

  /* stylelint-disable custom-property-pattern */
  --dk-side-panel-width: v-bind('`${DK_SIDE_PANEL_WIDTH}px`');
  --dk-header-height: v-bind('`${DK_HEADER_HEIGHT}px`');
  /* stylelint-enable custom-property-pattern */

  .nav {
    flex-grow: 0;
  }

  .content {
    flex-grow: 1;
    outline: none;
  }

  :deep(*) {
    box-sizing: border-box;
    scrollbar-width: inherit;
  }
}
</style>
