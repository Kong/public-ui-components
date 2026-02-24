<template>
  <div class="documentation">
    <div v-if="documentList && !documentList.length">
      <component :is="emptyStateCard ? 'KCard' : 'div'">
        <KEmptyState
          :action-button-text="t('documentation.show.empty_state_v2.cta')"
          :action-button-visible="userCanEdit"
          icon-background
          :message="t('documentation.show.empty_state_v2.description')"
          :title="t('documentation.show.empty_state_v2.title')"
          @click-action="handleAddClick"
        >
          <template #icon>
            <FileEmptyIcon decorative />
          </template>
          <template #action-button-icon>
            <AddIcon decorative />
          </template>
        </KEmptyState>
      </component>
    </div>
    <div
      v-else
      class="documentation-parent-container"
    >
      <KTreeList
        :key="`tree-list-${cacheKey}`"
        class="document-tree-list"
        :items="documentList"
        :max-depth="2"
        @change="(data: TreeListChangeEvent) => emit('parent-change', data)"
        @child-change="(data: TreeListChildChangeEvent) => emit('child-change', data)"
        @selected="(data: TreeListItem) => emit('document-selection', data)"
      />
      <DocumentationDisplay
        v-if="selectedDocument"
        :key="key"
        ref="documentationDisplay"
        :can-edit="canEdit"
        :card="card"
        class="document-holder"
        :hide-publish-toggle="hidePublishToggle"
        :selected-document="selectedDocument"
        @add="handleAddClick"
        @save-markdown="(content: string) => emit('save-markdown', content)"
        @toggle-published="(data: any) => emit('toggle-published', data)"
      />
    </div>
    <ProductDocumentModal
      v-if="displayModal"
      :action-pending="actionPending"
      :documents="documentList"
      :editing="editing"
      :error-message="modalErrorMessage"
      :hide-publish-toggle="hidePublishToggle"
      :record="editing && selectedDocument ? selectedDocument : undefined"
      @cancel="handleModalClosed"
      @delete="emit('delete')"
      @save="(formData: FormData, selectedFile: any) => emit('save', formData, selectedFile)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import DocumentationDisplay from './DocumentationDisplay.vue'
import ProductDocumentModal from './ProductDocumentModal.vue'
import type { PropType } from 'vue'
import type { DocumentListItem, DocumentTree, FormData } from '../types'
import type { TreeListItem, TreeListChangeEvent, TreeListChildChangeEvent } from '@kong/kongponents'
import composables from '../composables'
import { FileEmptyIcon, AddIcon } from '@kong/icons'

const emit = defineEmits<{
  (e: 'child-change', data: TreeListChildChangeEvent): void
  (e: 'click:learn-more'): void
  (e: 'delete'): void
  (e: 'document-selection', data: TreeListItem): void
  (e: 'modal-closed'): void
  (e: 'parent-change', data: TreeListChangeEvent): void
  (e: 'save', formData: FormData, selectedFile: any): void
  (e: 'save-markdown', content: string): void
  (e: 'toggle-published', data: boolean): void
}>()

const displayModal = ref<boolean>(false)
const editing = ref<boolean>(false)
const documentationDisplay = ref()

const { i18n: { t } } = composables.useI18n()


const props = defineProps({
  actionPending: {
    type: Boolean,
    default: false,
  },
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
  /**
   * Boolean assiting with responsive documents view
   */
  card: {
    type: Boolean,
    default: false,
  },
  documentList: {
    type: Array as PropType<DocumentListItem[]>,
    required: true,
  },
  /**
   * Boolean for wrapping the empty state component in a KCard
   */
  emptyStateCard: {
    type: Boolean,
    default: false,
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
  modalErrorMessage: {
    type: String,
    default: '',
  },
  selectedDocument: {
    type: Object as PropType<{ document: DocumentTree, ast: Record<string, any>, markdown?: string, status: 'published' | 'unpublished' }>,
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
  editing.value = false
  displayModal.value = true
}

const handleDownloadClick = (): void => {
  // exposed method from DocumentationDisplay
  documentationDisplay.value.download()
}

const handleEditDocClick = (): void => {
  // exposed method from DocumentationDisplay
  documentationDisplay.value.edit()
}

const handleModalClosed = (): void => {
  displayModal.value = false
  emit('modal-closed')
}

defineExpose({ download: handleDownloadClick, edit: handleEditDocClick })

const userCanEdit = ref<boolean>(false)

onBeforeMount(async () => {
  userCanEdit.value = await props.canEdit()
})
</script>

<style lang="scss" scoped>
.documentation {
  .doc-card-title {
    font-size: var(--kui-font-size-60, $kui-font-size-60);
  }

  .documentation-parent-container {
    display: flex;
    flex-direction: row;
  }

  .document-tree-list {
    flex: 0 0 15%;
    margin-right: var(--kui-space-80, $kui-space-80);
    position: relative;
    top: -7px;
  }

  .document-holder {
    width: 83%; // we need to set this explicitly to override width: 100%; inherited from KCard
  }
}
</style>
