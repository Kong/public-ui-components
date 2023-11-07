<template>
  <div class="documentation">
    <DocumentationPageEmptyState
      v-if="documentList && !documentList.length"
      :can-edit="canEdit"
      @create-documentation="handleAddClick"
    />
    <KCard
      v-else
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
            :key="key"
            :can-edit="canEdit"
            class="document-holder"
            :hide-publish-toggle="hidePublishToggle"
            :is-card="isCard"
            :selected-document="selectedDocument"
            @add-clicked="handleAddClick"
            @edit-clicked="handleEditClick"
            @toggle-published="(data) => emit('toggle-published', data)"
          />
        </div>
      </template>
    </KCard>
    <ProductDocumentModal
      v-if="displayModal"
      :documents="documentList"
      :error-message="modalErrorMessage"
      :hide-publish-toggle="hidePublishToggle"
      :is-editing="isEditing"
      :record="isEditing && selectedDocument ? selectedDocument : undefined"
      @canceled="handleModalClosed"
      @delete="emit('delete')"
      @save="(formData: FormData, selectedFile: any) => emit('save', formData, selectedFile)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DocumentationDisplay from './DocumentationDisplay.vue'
import DocumentationPageEmptyState from './DocumentationPageEmptyState.vue'
import ProductDocumentModal from './ProductDocumentModal.vue'
import type { PropType } from 'vue'
import type { DocumentListItem, DocumentTree, FormData } from '../types'
import type { ChangeEvent, ChildChangeEvent, TreeListItem } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'child-change', data: ChildChangeEvent): void,
  (e: 'delete'): void,
  (e: 'document-selection', data: TreeListItem): void,
  (e: 'modal-closed'): void,
  (e: 'parent-change', data: ChangeEvent): void,
  (e: 'save', formData: FormData, selectedFile: any): void,
  (e: 'toggle-published', data: boolean): void,
}>()

const displayModal = ref<boolean>(false)
const isEditing = ref<boolean>(false)

const props = defineProps({
  actionSuccess: {
    type: Boolean,
    default: false,
  },
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
   * The ID of the entity to which a document is associated.
   * Examples are API Product ID, Service ID etc.
   */
  entityId: {
    type: String,
    required: true,
  },
  hidePublishToggle: {
    type: Boolean,
    default: false,
  },
  /**
   * Boolean assiting with responsive documents view
   */
  isCard: {
    type: Boolean,
    default: false,
  },
  modalErrorMessage: {
    type: String,
    default: '',
  },
  selectedDocument: {
    type: Object as PropType<{ document: DocumentTree, ast: Object, status: 'published' | 'unpublished'}>,
    default: () => null,
  },
})

watch(() => props.actionSuccess, (newVal: boolean) => {
  if (newVal) {
    handleModalClosed()
  }
})

const key = computed((): string => `data-display-${props.cacheKey}-${props.selectedDocument?.document?.id || ''}`)

const handleAddClick = (): void => {
  isEditing.value = false
  displayModal.value = true
}

const handleEditClick = (): void => {
  isEditing.value = true
  displayModal.value = true
}

const handleModalClosed = (): void => {
  displayModal.value = false
  emit('modal-closed')
}
</script>

<style lang="scss" scoped>
.documentation-card {
  padding: $kui-space-80 $kui-space-0;

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
