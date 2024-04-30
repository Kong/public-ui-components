<template>
  <div class="documentation-action-menu">
    <KDropdown
      data-testid="documentation-actions-btn"
      :kpop-attributes="{ placement: 'bottomEnd' }"
      width="250"
    >
      <KButton
        class="action-btn"
        data-testid="documentation-actions"
      >
        {{ i18n.t('documentation.show.actions') }}
        <ChevronDownIcon />
      </KButton>
      <template #items>
        <!-- New menu items -->
        <KDropdownItem
          v-if="userCanEdit"
          data-testid="document-edit-button"
          @click="emit('edit-markdown')"
        >
          {{ i18n.t('documentation.show.actions_menu.edit_document') }}
        </KDropdownItem>
        <KDropdownItem
          v-if="userCanEdit"
          data-testid="document-settings-button"
          @click="emit('edit')"
        >
          {{ i18n.t('documentation.show.actions_menu.document_settings') }}
        </KDropdownItem>
        <KDropdownItem
          v-if="!!selectedDocument.markdown"
          data-testid="document-download-button"
          @click="handleDownloadDocument"
        >
          {{ i18n.t('documentation.show.actions_menu.download_document') }}
        </KDropdownItem>
        <KDropdownItem
          class="add-new-page-button"
          data-testid="add-new-page-button"
          @click="emit('add')"
        >
          {{ i18n.t('documentation.show.actions_menu.new_document') }}
        </KDropdownItem>
        <KDropdownItem
          class="edit-documentation-delete-button"
          danger
          data-testid="edit-documentation-delete-button"
          :has-divider="userCanEdit"
          @click="emit('delete')"
        >
          {{ i18n.t('documentation.show.actions_menu.delete_document') }}
        </KDropdownItem>
      </template>
    </KDropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDownIcon } from '@kong/icons'
import type { PropType } from 'vue'
import type { DocumentTree } from '../types'
import composables from '../composables'

const props = defineProps({
  /**
   * A synchronous or asynchronous function which returns a boolean evaluating
   * if the user can edit an entity by create a new document
   */
  canEdit: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => false,
  },
  selectedDocument: {
    type: Object as PropType<{ document: DocumentTree, ast: Object, markdown?: string, status: 'published' | 'unpublished'}>,
    default: () => null,
  },
})

const emit = defineEmits<{
  (e: 'add'): void,
  (e: 'edit'): void,
  (e: 'edit-markdown'): void,
  (e: 'download'): void,
  (e: 'delete'): void,
  (e: 'edit-markdown', isEditingMarkdown: boolean): void,
}>()

const { i18n } = composables.useI18n()

const handleDownloadDocument = (downloadFunction: () => void): void => {
  if (typeof downloadFunction === 'function') {
    downloadFunction()
    emit('download')
  }
}

const userCanEdit = ref(false)
watch(() => props.canEdit, async () => {
  userCanEdit.value = await props.canEdit()
}, { immediate: true })

</script>
