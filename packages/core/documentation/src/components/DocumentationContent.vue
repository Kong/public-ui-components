<template>
  <KCard
    border-variant="noBorder"
    class="documentation-content"
  >
    <template #body>
      <div class="documentation-parent-container">
        <KTreeList
          :key="`tree-list-${cacheKey}`"
          class="document-tree-list"
          :items="documentList"
          :max-depth="2"
          @change="(data) => emit('parent-change', data)"
          @child-change="(data) => emit('child-change', data)"
          @selected="(data) => emit('document-selection', data)"
        />
        <DocumentationDisplay
          v-if="selectedDocument"
          :key="`data-display-${cacheKey}-${selectedDocument.id}`"
          :can-edit="canEdit"
          class="document-holder"
          :document-response="documentResponse"
          :is-card="isCard"
          :record="selectedDocument"
          :service-package-id="entityId"
          @add-clicked="emit('create')"
          @edit-clicked="emit('edit')"
          @publish-toggled="(data) => emit('toggle-publish', data)"
        />
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import DocumentationDisplay from './DocumentationDisplay.vue'
import type { PropType } from 'vue'
import type { AxiosResponse } from 'axios'
import type { DocumentListItem, DocumentTree } from '../types'

// TODO: attempt to add types
const emit = defineEmits([
  'child-change',
  'create',
  'document-selection',
  'edit',
  'parent-change',
  'toggle-publish',
])

// TODO: add comments for each prop
defineProps({
  cacheKey: {
    type: Number,
    default: 0,
  },
  /**
   * A synchronous or asynchronous function which returns a boolean evaluating
   * if the user can edit an entity by create a new document
   */
  canEdit: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
  documentList: {
    type: Array as PropType<DocumentListItem[]>,
    required: true,
  },
  /**
   * A function which returns a document response object
   */
  documentResponse: {
    type: Object as PropType<AxiosResponse>,
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  isCard: {
    type: Boolean,
    default: false,
  },
  selectedDocument: {
    type: Object as PropType<DocumentTree>,
    default: () => null,
  },
})
</script>

<style lang="scss" scoped>
.documentation-content {
  .doc-card-title {
    font-size: $kui-font-size-60;
  }

  .documentation-parent-container {
    display: flex;
    flex-direction: row;
  }

  .document-tree-list {
    flex: 0 0 15%;
    margin-right: $kui-space-80;
    position: relative;
    top: -7px;
  }

  .document-holder {
    width: 82.5%; // we need to set this explicitly to override width: 100%; inherited from KCard
  }
}
</style>
