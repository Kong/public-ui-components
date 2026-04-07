<template>
  <div class="documentation-display">
    <div class="document-meta">
      <div class="document-meta-start">
        <div class="document-title meta-section">
          <slot name="document-title">
            <span>{{ fileName }}</span>.<span class="document-title-extension">md</span>
          </slot>
        </div>

        <div
          v-if="!hidePublishToggle"
          class="document-status meta-section"
        >
          <span class="meta-label">{{ i18n.t('documentation.documentation_display.status_label') }}</span>
          <KBadge :appearance="publishModel ? 'success' : 'neutral'">
            {{ publishModel ? i18n.t('documentation.common.published') : i18n.t('documentation.common.unpublished') }}
          </KBadge>
        </div>

        <div
          v-if="createdAt"
          class="document-create meta-section"
        >
          <span class="meta-label">{{ i18n.t('documentation.documentation_display.added_label') }}</span>
          <KBadge appearance="neutral">
            {{ createdAt }}
          </KBadge>
        </div>
      </div>

      <div class="document-display-actions">
        <PermissionsWrapper :auth-function="() => canEdit()">
          <KInputSwitch
            v-if="!hidePublishToggle && !card"
            class="document-publish-toggle"
            data-testid="document-publish-toggle"
            :label="publishedStatusText"
            label-before
            :model-value="publishModel"
            @click="_handlePublishToggle"
          />
        </PermissionsWrapper>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="markdown-content-loading"
      data-testid="markdown-content-loading"
    >
      <KSkeleton
        v-if="!card"
        class="markdown-content-loader"
      />

      <KSkeleton
        v-else
        type="card"
      />
    </div>

    <div v-else>
      <div
        class="document-content"
        :class="{ 'content-card-view': card }"
      >
        <MarkdownUi
          v-if="markdownContent !== undefined"
          ref="markdownComponent"
          v-model="markdownContent"
          downloadable
          :editable="userCanEdit"
          :filename="fileName"
          :max-height="700"
          mode="read"
          theme="light"
          @cancel="restoreOriginalDocument"
          @mode="(mode: MarkdownMode) => handleMarkdownUiModeChange(mode)"
          @save="(payload: EmitUpdatePayload) => {
            emit('save-markdown', payload.content)
            originalMarkdownContent = payload.content
          }"
        />
      </div>
      <DiscardChangesPrompt
        v-if="showDiscardChangesMessage"
        :visible="showDiscardChangesMessage"
        @cancel="showDiscardChangesMessage = false"
        @discard-changes="() => {
          restoreOriginalDocument()
          handlePublishToggle()
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import composables from '../composables'
import { isObjectEmpty } from '../helpers'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'
import { MarkdownUi } from '@kong/markdown'
import type { EmitUpdatePayload, MarkdownMode } from '@kong/markdown'
import '@kong/markdown/dist/style.css'
import type { PropType } from 'vue'
import type { DocumentTree } from '../types'
import DiscardChangesPrompt from './DiscardChangesPrompt.vue'

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
  card: {
    type: Boolean,
    default: false,
  },
  hidePublishToggle: {
    type: Boolean,
    default: false,
  },
  selectedDocument: {
    type: Object as PropType<{ document: DocumentTree, ast: Record<string, any>, markdown?: string, status: 'published' | 'unpublished' }>,
    default: () => null,
  },
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'toggle-published', newValue: boolean): void
  (e: 'edit-markdown', isEditingMarkdown: boolean): void
  (e: 'save-markdown', content: string): void
}>()

const markdownComponent = ref()
const { i18n } = composables.useI18n()
const isLoading = ref(true)
const fileName = computed((): string => props.selectedDocument?.document?.title || props.selectedDocument?.document?.revision?.title || '')
const createdAt = computed((): string => '')
const publishModel = ref<boolean>(false)
const publishedStatusText = ref(i18n.t('documentation.common.unpublished'))
const markdownContent = ref<string>(props.selectedDocument?.markdown || '')
// Store the previous markdown content in case the user cancels editing
const originalMarkdownContent = ref<string>(markdownContent.value)
const defaultDocument = ref<any>(null)
const showDiscardChangesMessage = ref(false)
const currentMode = ref<MarkdownMode>('read')

// Handle the download of the markdown content
const handleDownload = (): void => {
  markdownComponent.value.download()
}

// Handle the edit of the markdown content
const handleEdit = (): void => {
  markdownComponent.value.edit()
}

// helper to attach/detach a native input listener on the editor textarea
const editorInputRemover = ref<null | (() => void)>(null)
const attachEditorInputListener = async (): Promise<void> => {
  await nextTick()
  try {
    const root = markdownComponent.value?.$el || markdownComponent.value
    const textarea: HTMLTextAreaElement | null = root?.querySelector?.('textarea') ?? null
    if (!textarea) return
    const handler = (e: Event) => {
      const t = e.target as HTMLTextAreaElement
      markdownContent.value = t.value
    }
    textarea.addEventListener('input', handler)
    editorInputRemover.value = () => {
      textarea.removeEventListener('input', handler)
      editorInputRemover.value = null
    }
  } catch (err) {
    // noop - defensive
  }
}
const detachEditorInputListener = (): void => {
  if (editorInputRemover.value) {
    editorInputRemover.value()
  }
}

const handleMarkdownUiModeChange = (mode: MarkdownMode): void => {
  currentMode.value = mode
  emit('edit-markdown', mode === 'edit')

  // attach/detach native input listener so changes during edit are reflected immediately
  if (mode === 'edit' || mode === 'split') {
    attachEditorInputListener()
  } else {
    detachEditorInputListener()
  }
}

const _handlePublishToggle = (): void => {
  // check for unsaved changes
  if (['edit', 'split'].includes(currentMode.value) && (markdownContent.value !== originalMarkdownContent.value)) {
    showDiscardChangesMessage.value = true
  } else {
    handlePublishToggle()
  }
}

const handlePublishToggle = (): void => {
  const newValue = !publishModel.value

  emit('toggle-published', newValue)
  publishModel.value = newValue
  publishedStatusText.value = newValue
    ? i18n.t('documentation.common.published')
    : i18n.t('documentation.common.unpublished')
  showDiscardChangesMessage.value = false
}

const restoreOriginalDocument = (): void => {
  markdownContent.value = originalMarkdownContent.value
  originalMarkdownContent.value = markdownContent.value
}

const setStatus = (status?: string): void => {
  if (status === 'published') {
    publishModel.value = true
    publishedStatusText.value = i18n.t('documentation.common.published')
  } else {
    publishModel.value = false
    publishedStatusText.value = i18n.t('documentation.common.unpublished')
  }
}

const handleDocument = () => {
  defaultDocument.value = {
    children: props.selectedDocument.ast,
    type: 'document',
    version: 1,
  }

  markdownContent.value = props.selectedDocument?.markdown || ''
  originalMarkdownContent.value = markdownContent.value
  isLoading.value = false
}

const userCanEdit = ref(false)
watch(() => props.canEdit, async () => {
  userCanEdit.value = await props.canEdit()
}, { immediate: true })

watch(() => props.selectedDocument, (newVal) => {
  if (!isObjectEmpty(newVal)) {
    if (!props.hidePublishToggle) {
      setStatus(newVal.document?.status)
    }

    // Ensure we trigger updates for ast and markdown content
    if (newVal.ast || newVal.markdown) {
      handleDocument()
    }
  }
}, { deep: true, immediate: true })

onMounted(() => {
  handleDocument()
})

// cleanup listener on unmount
onBeforeUnmount(() => {
  detachEditorInputListener()
})

// Expose the download and edit methods from Markdown component
defineExpose({ download: handleDownload, edit: handleEdit })

</script>

<style lang="scss" scoped>
.document-content {
  min-height: 450px; // fixes flaky jump when markdown content loads and renders, changing height of the container
  padding: var(--kui-space-50, $kui-space-50) var(--kui-space-70, $kui-space-70) var(--kui-space-50, $kui-space-50);
}

.markdown-content-loading {
  padding: var(--kui-space-70, $kui-space-70);
}

.markdown-content-loading :deep(.skeleton-card-column) {
  margin-bottom: var(--kui-space-0, $kui-space-0);
}

.markdown-content-loading :deep(.skeleton-card) {
  min-height: 450px; // fixes flaky jump when markdown content loads and renders, changing height of the container
}

.content-card-view {
  @media (min-width: $kui-breakpoint-phablet) {
    max-height: 450px;
    overflow-y: scroll;
  }
}

.documentation-display {
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);

  .document-meta {
    align-items: center;
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-70, $kui-space-70);
    row-gap: var(--kui-space-40, $kui-space-40);

    .document-meta-start {
      display: flex;
    }
  }

  .meta-section {
    align-self: center;
  }

  .meta-label {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }

  .document-title {
    color: #0b172d;
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    margin-right: var(--kui-space-50, $kui-space-50);

    &-extension {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    }
  }

  .document-status {
    margin-right: var(--kui-space-50, $kui-space-50);
  }

  .document-display-actions {
    align-items: center;
    display: flex;
  }

  .document-publish-toggle {
    margin-right: var(--kui-space-50, $kui-space-50);
  }
}
</style>
