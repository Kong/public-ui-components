<template>
  <div class="sandbox-container">
    <div class="action-toggles">
      <KInputSwitch
        v-model="isAllowedEdit"
        label="canEdit"
      />
      <KInputSwitch
        v-model="isCard"
        label="isCard"
      />
      <KInputSwitch
        v-model="isDarkMode"
        label="isDarkMode"
      />
    </div>

    <DocumentationContent
      :key="key"
      :action-pending="false"
      :action-success="false"
      :can-edit="canEdit"
      :card="isCard"
      :document-list="(documentListResponse.data as DocumentListItem[])"
      entity-id="1234-567-i-love-cats"
      :selected-document="selectedDocument"
      :theme="isDarkMode ? 'dark' : 'light'"
      @child-change="handleChildChange"
      @delete="handleDelete"
      @document-selection="handleDocSelection"
      @edit="handleEdit"
      @modal-closed="() => {}"
      @parent-change="handleParentChange"
      @save="handleSave"
      @toggle-published="handlePublishToggle"
    />
  </div>
</template>

<script setup lang="ts">
import type { DocumentTree } from '../src/types'
import { DocumentationContent } from '../src'
import { ref, computed, watch } from 'vue'
import { selectedDocResponse, documentListResponse } from './sample_data'

type SelectedDocument = {
  document: DocumentTree
  status: 'published' | 'unpublished'
  ast: Record<string, any>
  markdown?: string // The raw markdown
}

interface DocumentListItem {
  name: string
  id: string
  record: DocumentTree
  children?: DocumentListItem[]
  selected?: boolean
}

const key = ref(0)
const isAllowedEdit = ref(true)
const isCard = ref(false)
const isDarkMode = ref(false)

const selectedDocument = computed((): SelectedDocument => {
  return {
    ast: selectedDocResponse.ast,
    markdown: selectedDocResponse.str_md_content,
    document: documentListResponse.data[0].record,
    status: selectedDocResponse.status as 'published' | 'unpublished',
  }
})

const canEdit = async () => isAllowedEdit.value

const handleDocSelection = async (item: any): Promise<void> => {
  console.log('document-selection', item)
}

const handleParentChange = (): void => {
  console.log('parent-change')
}

const handleChildChange = (): void => {
  console.log('child-change')
}

const handleDelete = (): void => {
  console.log('delete')
}

const handleEdit = (): void => {
  console.log('edit')
}

const handlePublishToggle = (): void => {
  console.log('toggle-published')
}

const handleSave = (): void => {
  console.log('save')
}

watch([isAllowedEdit, isCard], () => {
  key.value++
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;

  .action-toggles {
    display: flex;
    gap: 20px;
  }
}
</style>
