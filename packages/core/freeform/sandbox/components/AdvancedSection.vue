<template>
  <KCollapse
    ref="collapse"
    v-model="collapsed"
    trigger-label="Advanced"
  >
    <slot />
  </KCollapse>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRevealOpen } from '../../src'

// A collapsed section that keeps its fields mounted (`KCollapse` uses `v-show`)
// and opens when the form reveals a field inside it
const collapsed = ref(true)
const collapse = useTemplateRef<{ $el: Element }>('collapse')

useRevealOpen(() => collapse.value?.$el, () => {
  collapsed.value = false
})
</script>
