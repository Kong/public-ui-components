<template>
  <div
    v-if="open"
    class="dk-editor-modal"
  >
    <EditorNav
      class="nav"
      @back="handleBack"
    />
    <EditorPanel class="panel" />
  </div>
</template>

<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
import { watch } from 'vue'

import EditorNav from './EditorNav.vue'
import EditorPanel from './EditorPanel.vue'

const open = defineModel<boolean>('open')

const emit = defineEmits<{
  close: []
}>()

const isLocked = useScrollLock(document)

watch(open, (value) => {
  isLocked.value = !!value
}, { immediate: true })

function handleBack() {
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
  top: 0;
  width: 100%;
  z-index: 1000;

  /* stylelint-disable custom-property-pattern */
  --dk-sidebar-width: 220px;
  --dk-header-height: 44px;
  /* stylelint-enable custom-property-pattern */

  .nav {
    flex-grow: 0;
  }

  .panel {
    flex-grow: 1;
  }

  :deep(*) {
    box-sizing: border-box;
  }
}
</style>
