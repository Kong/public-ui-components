<template>
  <div class="document-viewer">
    <Children />
  </div>
</template>

<script setup lang="ts">
import renderChildren from './renderChildren'
import { PropType } from 'vue'
import { Document } from '../types'

const props = defineProps({
  document: {
    type: Object as PropType<Document>,
    required: true,
  },
})

const Children = () => props.document?.children ? renderChildren(props.document.children) : null
</script>

<style>
:root {
  --document-viewer-font-family-default: Roboto, Helvetica, sans-serif;
  --document-viewer-font-family-monospace: Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}
</style>
<style scoped>
.document-viewer {
  font-family: var(--document-viewer-font-family-default);
  font-size: var(--document-viewer-font-size, 16px);
  color: var(--document-viewer-color, #000);
}
</style>
