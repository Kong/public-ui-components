<template>
  <KCard
    border-variant="noBorder"
    class="documentation-card"
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
          :document-ast="documentAst"
          :document-status="documentStatus"
          :is-card="isCard"
          :record="selectedDocument"
          @add-clicked="emit('create')"
          @edit-clicked="emit('edit')"
          @toggle-published="(data) => emit('toggle-published', data)"
        />
      </div>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import DocumentationDisplay from './DocumentationDisplay.vue'
import type { PropType } from 'vue'
import type { DocumentListItem, DocumentTree } from '../types'
import type { ChangeEvent, ChildChangeEvent, TreeListItem } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'child-change', data: ChildChangeEvent): void,
  (e: 'create'): void,
  (e: 'document-selection', data: TreeListItem): void,
  (e: 'edit'): void,
  (e: 'parent-change', data: ChangeEvent): void,
  (e: 'toggle-published', data: boolean): void,
}>()

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
   * The abstract syntax tree content for the document to be displayed
   */
  documentAst: {
    type: Array,
    required: true,
  },
  /**
   * The publish status of the document to be displayed
   */
  documentStatus: {
    type: String,
    required: true,
  },
  /**
   * The ID of the entity to which a document is associated.
   * Examples are API Product ID, Service ID etc.
   */
  entityId: {
    type: String,
    required: true,
  },
  /**
   * Boolean assiting with responsive documents view
   */
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
.documentation-card {
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
