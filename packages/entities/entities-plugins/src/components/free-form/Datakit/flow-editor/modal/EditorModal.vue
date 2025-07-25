<template>
  <div
    v-if="open"
    ref="modal"
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
  </div>
</template>

<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { nextTick, useTemplateRef, watch } from 'vue'
import { DK_HEADER_HEIGHT, DK_SIDE_PANEL_WIDTH } from '../../constants'

import EditorNav from './EditorNav.vue'
import EditorContent from './EditorContent.vue'

const modal = useTemplateRef('modal')

const open = defineModel<boolean>('open')

const emit = defineEmits<{
  close: []
}>()

const content = useTemplateRef('content')
const isLocked = useScrollLock(document)
const { activate, deactivate } = useFocusTrap(modal, {
  returnFocusOnDeactivate: true,
  initialFocus: () => content.value?.$el,
})

watch(open, async (value) => {
  isLocked.value = !!value

  await nextTick()

  if (value) {
    activate()
  } else {
    deactivate()
  }
}, { immediate: true })

function close() {
  open.value = false
  emit('close')
}
</script>

<style lang="scss" scoped>
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
  --dk-side-panel-width: v-bind('DK_SIDE_PANEL_WIDTH');
  --dk-header-height: v-bind('DK_HEADER_HEIGHT');
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
