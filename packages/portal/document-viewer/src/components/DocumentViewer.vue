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

<style lang="scss">
:root {
  --kong-ui-document-viewer-font-family-default: #{$kui-font-family-text};
  --kong-ui-document-viewer-font-family-monospace: #{$kui-font-family-code};
}
</style>
<style lang="scss" scoped>
.document-viewer {
  color: var(--kui-color-text, $kui-color-text);
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
}
</style>
