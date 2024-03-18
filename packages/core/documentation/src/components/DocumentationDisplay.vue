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

      <div
        class="document-display-actions"
      >
        <PermissionsWrapper
          :auth-function="() => canEdit()"
        >
          <KInputSwitch
            v-if="!hidePublishToggle && !card"
            v-model="publishModel"
            class="document-publish-toggle"
            data-testid="document-publish-toggle"
            :label="publishedStatusText"
            label-before
            @click="handlePublishToggle"
          />
        </PermissionsWrapper>
        <PermissionsWrapper
          :auth-function="() => canEdit()"
        >
          <KButton
            appearance="secondary"
            class="document-edit-button"
            data-testid="document-edit-button"
            size="small"
            @click="emit('edit')"
          >
            {{ i18n.t('documentation.documentation_display.edit_info_button') }}
          </KButton>
          <KButton
            appearance="primary"
            data-testid="add-new-page-button"
            size="small"
            @click="emit('add')"
          >
            {{ i18n.t('documentation.documentation_display.add_new') }}
          </KButton>
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
          v-model="markdownContent"
          downloadable
          :editable="userCanEdit"
          :filename="fileName"
          :max-height="600"
          mode="read"
          theme="light"
          @cancel="restoreOriginalDocument"
          @mode="(mode: MarkdownMode) => handleMarkdownUiModeChange(mode)"
          @save="(payload: EmitUpdatePayload) => emit('save-markdown', payload.content)"
        >
          <template
            v-if="userCanEdit || !!selectedDocument.markdown"
            #content-actions="{ download, edit }"
          >
            <KDropdown
              class="content-actions-dropdown"
              :kpop-attributes="{ placement: 'bottomEnd' }"
            >
              <template #default>
                <KTooltip :text="i18n.t('documentation.documentation_display.actions_title')">
                  <KButton
                    appearance="secondary"
                    :aria-label="i18n.t('documentation.documentation_display.actions_title')"
                    class="icon-button"
                  >
                    <MoreIcon decorative />
                  </KButton>
                </KTooltip>
              </template>
              <template #items>
                <KDropdownItem
                  v-if="userCanEdit"
                  data-testid="document-edit-button"
                  @click="edit"
                >
                  {{ i18n.t('documentation.documentation_display.edit_markdown_button') }}
                </KDropdownItem>
                <KDropdownItem
                  v-if="!!selectedDocument.markdown"
                  data-testid="document-download-button"
                  :has-divider="userCanEdit"
                  @click="handleDownloadDocument(download)"
                >
                  {{ i18n.t('documentation.documentation_display.download_button') }}
                </KDropdownItem>
              </template>
            </KDropdown>
          </template>
        </MarkdownUi>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import composables from '../composables'
import { isObjectEmpty } from '../helpers'
import { PermissionsWrapper } from '@kong-ui-public/entities-shared'
import { MarkdownUi } from '@kong/markdown'
import type { EmitUpdatePayload, MarkdownMode } from '@kong/markdown'
import { MoreIcon } from '@kong/icons'
import '@kong/markdown/dist/style.css'
import type { PropType } from 'vue'
import type { DocumentTree } from '../types'

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
    type: Object as PropType<{ document: DocumentTree, ast: Object, markdown?: string, status: 'published' | 'unpublished'}>,
    default: () => null,
  },
})

const emit = defineEmits<{
  (e: 'add'): void,
  (e: 'edit'): void,
  (e: 'download'): void,
  (e: 'toggle-published', newValue: boolean): void,
  (e: 'edit-markdown', isEditingMarkdown: boolean): void,
  (e: 'save-markdown', content: string): void,
}>()

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

const handleDownloadDocument = (downloadFunction: () => void): void => {
  if (typeof downloadFunction === 'function') {
    downloadFunction()
    emit('download')
  }
}

const handleMarkdownUiModeChange = (mode: MarkdownMode): void => {
  emit('edit-markdown', mode === 'edit')
}

const handlePublishToggle = (): void => {
  const newValue = !publishModel.value

  emit('toggle-published', newValue)
  publishModel.value = newValue
  publishedStatusText.value = newValue
    ? i18n.t('documentation.common.published')
    : i18n.t('documentation.common.unpublished')
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
</script>

<style lang="scss" scoped>
.document-content {
  min-height: 450px; // fixes flaky jump when markdown content loads and renders, changing height of the container
  padding: $kui-space-50 $kui-space-70 $kui-space-50;
}

.markdown-content-loading {
  padding: $kui-space-70;
}

.markdown-content-loading :deep(.skeleton-card-column) {
  margin-bottom: $kui-space-0;
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
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-20;
  margin-top: $kui-space-20;

  .document-meta {
    align-items: center;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: $kui-space-40 $kui-space-70;
    row-gap: $kui-space-40;

    .document-meta-start {
      display: flex;
    }
  }

  .meta-section {
    align-self: center;
  }

  .meta-label {
    color: $kui-color-text-neutral;
  }

  .document-title {
    color: #0b172d;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    margin-right: $kui-space-50;
    &-extension {
      color: $kui-color-text-neutral;
    }
  }

  .document-status {
    margin-right: $kui-space-50;
  }

  .document-display-actions {
    align-items: center;
    display: flex;
  }

  .document-publish-toggle {
    margin-right: $kui-space-80;
  }

  .document-download-button,
  .document-edit-button {
    margin-right: $kui-space-40;
  }
}
</style>
