<template>
  <div
    class="document-viewer"
    data-testid="document-viewer"
  >
    <Children v-if="hasRequiredProps" />
    <div
      v-else
      data-testid="document-viewer-error"
    >
      {{ i18n.t('documentViewer.error') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import renderChildren from './renderChildren'
import { computed } from 'vue'
import composables from '../composables'
import { addUniqueHeadingSlugs } from '../utils/addUniqueHeadingSlugs'

const props = defineProps({
  document: {
    type: Object,
    required: true,
  },
})

const { i18n } = composables.useI18n()

const objectIsEmpty = (obj: any): boolean => (!obj || (Object.keys(obj).length === 0 && obj.constructor === Object))

const hasRequiredProps = computed((): boolean => {
  // Ensure the document object that is passed in is not empty
  return !objectIsEmpty(props.document)
})

const children = addUniqueHeadingSlugs(props.document?.children)
const Children = () => props.document?.children ? renderChildren(children) : null
</script>

<style>
:root {
  --document-viewer-font-family-default: Roboto, Helvetica, sans-serif;
  --document-viewer-font-family-monospace: Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}
</style>
<style scoped>
.document-viewer {
  color: var(--document-viewer-color, var(--text_colors-primary, #0b172d));
  font-family: var(--document-viewer-font-family-default, var(--font-family-sans));
  font-size: var(--document-viewer-font-size, 16px);
}
</style>
